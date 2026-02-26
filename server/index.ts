import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { registerAdminRoutes } from "./adminRoutes";
import authRoutes from "./authRoutes";
import billingRoutes from "./billingRoutes";
import { serveStatic } from "./static";
import { createServer } from "http";
import cron from "node-cron";
import { generateDailyContent, getTodayKeyET, postDailyToFacebook } from "./dailyContentGenerator";
import { sendPushToAll } from "./pushService";
import { WebhookHandlers } from "./webhookHandlers";
import prayerWallRoutes from "./prayerWallRoutes";
import playlistRoutes from "./playlistRoutes";


process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[FATAL] Unhandled rejection:', reason?.message || reason);
  if (reason?.stack) console.error(reason.stack);
});

const originalExit = process.exit.bind(process);
(process as any).exit = (code?: number) => {
  if (code !== 0) {
    console.error(`[GUARD] process.exit(${code}) intercepted — keeping server alive`);
    console.error(new Error().stack);
    return undefined as never;
  }
  return originalExit(code);
};

for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGUSR1', 'SIGUSR2'] as const) {
  process.on(sig, () => {
    console.error(`[SIGNAL] Received ${sig} — ignoring to keep server alive`);
  });
}

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      await ensureStripeSync();
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  app.use(authRoutes);
  app.use(billingRoutes);
  app.use(prayerWallRoutes);
  app.use(playlistRoutes);
  registerAdminRoutes(app);
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    log(`Error ${status}: ${message}`, "error");
    if (err.stack) {
      console.error(err.stack);
    }
    res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  
  const startServer = () => {
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`serving on port ${port}`);
        runStartupGeneration();
      },
    );
  };

  httpServer.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      log(`Port ${port} is already in use, retrying in 1 second...`);
      setTimeout(() => {
        httpServer.close();
        startServer();
      }, 1000);
    } else {
      log(`Server error: ${e.message}`);
    }
  });

  cron.schedule("0 6 * * *", async () => {
    const dayKey = getTodayKeyET();
    log(`[CRON-6AM] Triggered at ${new Date().toISOString()} — dayKey=${dayKey}`, "cron");
    try {
      const result = await generateDailyContent(dayKey);
      log(`[CRON-6AM] Content: status=${result.status}, dayKey=${result.dayKey}`, "cron");
    } catch (err: any) {
      log(`[CRON-6AM] ERROR generating content: ${err.message || err}`, "cron");
    }
    try {
      const pushResult = await sendPushToAll({
        title: "BP \u2014 Devotion du jour",
        body: "Le verset et la m\u00e9ditation d'aujourd'hui sont pr\u00eats. Touchez pour lire.",
        url: "/devotion",
      });
      log(`[CRON-6AM] Push notifications sent: sent=${pushResult.sent}, failed=${pushResult.failed}, cleaned=${pushResult.cleaned}`, "cron");
    } catch (pushErr: any) {
      log(`[CRON-6AM] ERROR sending push notifications: ${pushErr.message || pushErr}`, "cron");
    }
    try {
      const fbResult = await postDailyToFacebook();
      log(`[CRON-6AM] Facebook auto-post: status=${fbResult.status}${fbResult.postId ? `, postId=${fbResult.postId}` : ""}${fbResult.error ? `, error=${fbResult.error}` : ""}`, "cron");
    } catch (fbErr: any) {
      log(`[CRON-6AM] ERROR posting to Facebook: ${fbErr.message || fbErr}`, "cron");
    }
  }, {
    timezone: "America/New_York",
  });
  log("[CRON-6AM] node-cron scheduled for exactly 6:00 AM America/New_York daily", "cron");

  try {
    startServer();
  } catch (err) {
    log(`Failed to start server: ${err}`);
  }
})();

async function runStartupGeneration() {
  const dayKey = getTodayKeyET();
  log(`[STARTUP] Checking if daily content exists for dayKey=${dayKey}`, "startup");
  try {
    const result = await generateDailyContent(dayKey);
    log(`[STARTUP] Result: status=${result.status}, dayKey=${result.dayKey}, languages=${result.languages.join(",") || "all existed"}`, "startup");
  } catch (err: any) {
    log(`[STARTUP] ERROR generating daily content: ${err.message || err}`, "startup");
  }

  try {
    const { seedAdminData, seedGenresAndMoods } = await import("./seed");
    await seedAdminData();
    await seedGenresAndMoods();
  } catch (err: any) {
    log(`[STARTUP] Seed: ${err.message || err}`, "startup");
  }

  try {
    const { db: startupDb } = await import("./db");
    const { users: usersTable } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    const ownerEmail = "wilgens007@gmail.com";
    const [owner] = await startupDb.select().from(usersTable).where(eq(usersTable.email, ownerEmail));
    if (owner && !owner.isPremium) {
      await startupDb.update(usersTable).set({ isPremium: true, premiumSince: new Date() }).where(eq(usersTable.id, owner.id));
      log(`[STARTUP] Granted premium to owner: ${ownerEmail}`, "startup");
    }
  } catch (err: any) {
    log(`[STARTUP] Owner premium check: ${err.message || err}`, "startup");
  }

  setTimeout(() => initStripe(), 15000);
}

let stripeSyncReady = false;

async function initStripe() {
  try {
    const { runMigrations } = await import('stripe-replit-sync');

    log('[STRIPE] Initializing Stripe schema...', 'stripe');
    await runMigrations({ databaseUrl: process.env.DATABASE_URL! });
    log('[STRIPE] Schema ready', 'stripe');

    const { seedStripeProducts } = await import('./seedProducts');
    await seedStripeProducts();

    log('[STRIPE] Deferring webhook + sync to first request', 'stripe');
  } catch (err: any) {
    log(`[STRIPE] Init error: ${err.message || err}`, 'stripe');
  }
}

export async function ensureStripeSync() {
  if (stripeSyncReady) return;
  stripeSyncReady = true;
  try {
    const { getStripeSync } = await import('./stripeClient');
    const stripeSync = await getStripeSync();

    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`
    );
    log(`[STRIPE] Webhook configured: OK`, 'stripe');

    stripeSync.syncBackfill()
      .then(() => log('[STRIPE] Data synced', 'stripe'))
      .catch((err: any) => log(`[STRIPE] Sync error: ${err.message}`, 'stripe'));
  } catch (err: any) {
    stripeSyncReady = false;
    log(`[STRIPE] Sync init error: ${err.message || err}`, 'stripe');
  }
}
