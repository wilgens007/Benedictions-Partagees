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
import googleBillingRoutes from "./googleBillingRoutes";


process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[FATAL] Unhandled rejection:', reason?.message || reason);
  if (reason?.stack) console.error(reason.stack);
});

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
      log('[STRIPE-WEBHOOK] Missing stripe-signature header', 'stripe');
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        log('STRIPE WEBHOOK ERROR: req.body is not a Buffer, type=' + typeof req.body, 'stripe');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      log(`[STRIPE-WEBHOOK] Received webhook call (${req.body.length} bytes)`, 'stripe');
      await ensureStripeSync();
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      log('[STRIPE-WEBHOOK] Processed successfully', 'stripe');
      res.status(200).json({ received: true });
    } catch (error: any) {
      log(`[STRIPE-WEBHOOK] Error: ${error.message}`, 'stripe');
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
  app.use(googleBillingRoutes);
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

  let retryCount = 0;
  const MAX_RETRIES = 5;
  httpServer.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      retryCount++;
      if (retryCount > MAX_RETRIES) {
        log(`Port ${port} still in use after ${MAX_RETRIES} retries — exiting so workflow can restart fresh`);
        process.exit(1);
        return;
      }
      log(`Port ${port} is already in use, retrying in 2 seconds... (attempt ${retryCount}/${MAX_RETRIES})`);
      setTimeout(() => {
        httpServer.close();
        startServer();
      }, 2000);
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
    const alreadySent = await wasPushSentToday(dayKey);
    if (!alreadySent) {
      await markPushSent(dayKey);
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
    } else {
      log(`[CRON-6AM] Push already sent today for ${dayKey}, skipping`, "cron");
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

async function wasPushSentToday(dayKey: string): Promise<boolean> {
  try {
    const { db: checkDb } = await import("./db");
    const { dailyContent } = await import("@shared/schema");
    const { and, eq } = await import("drizzle-orm");
    const rows = await checkDb.select().from(dailyContent).where(
      and(eq(dailyContent.dayKey, dayKey), eq(dailyContent.language, "_ps"))
    );
    return rows.length > 0;
  } catch { return false; }
}

async function markPushSent(dayKey: string) {
  try {
    const { db: markDb } = await import("./db");
    const { dailyContent } = await import("@shared/schema");
    await markDb.insert(dailyContent).values({
      id: `push-sent-${dayKey}`,
      dayKey,
      language: "_ps",
      verse: "",
      reference: "",
      devotional: "",
      prayer: "",
      encouragementText: "",
      encouragementAuthor: "",
    }).onConflictDoNothing();
  } catch (err: any) {
    log(`[PUSH-MARKER] Error marking push sent: ${err.message || err}`, "startup");
  }
}

async function runStartupGeneration() {
  const dayKey = getTodayKeyET();
  log(`[STARTUP] Checking if daily content exists for dayKey=${dayKey}`, "startup");
  let contentReady = false;
  try {
    const result = await generateDailyContent(dayKey);
    log(`[STARTUP] Result: status=${result.status}, dayKey=${result.dayKey}, languages=${result.languages.join(",") || "all existed"}`, "startup");
    contentReady = true;
  } catch (err: any) {
    log(`[STARTUP] ERROR generating daily content: ${err.message || err}`, "startup");
  }

  try {
    const nowET = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const hourET = nowET.getHours();
    const alreadySent = await wasPushSentToday(dayKey);
    if (hourET >= 6 && !alreadySent && contentReady) {
      await markPushSent(dayKey);
      log(`[STARTUP] It's past 6 AM ET (${hourET}:${nowET.getMinutes().toString().padStart(2, "0")}), sending startup push notifications`, "startup");
      try {
        const pushResult = await sendPushToAll({
          title: "BP \u2014 Devotion du jour",
          body: "Le verset et la m\u00e9ditation d'aujourd'hui sont pr\u00eats. Touchez pour lire.",
          url: "/devotion",
        });
        log(`[STARTUP] Push notifications sent: sent=${pushResult.sent}, failed=${pushResult.failed}, cleaned=${pushResult.cleaned}`, "startup");
      } catch (pushErr: any) {
        log(`[STARTUP] ERROR sending push notifications: ${pushErr.message || pushErr}`, "startup");
      }
      try {
        const fbResult = await postDailyToFacebook();
        log(`[STARTUP] Facebook auto-post: status=${fbResult.status}${fbResult.postId ? `, postId=${fbResult.postId}` : ""}${fbResult.error ? `, error=${fbResult.error}` : ""}`, "startup");
      } catch (fbErr: any) {
        log(`[STARTUP] ERROR posting to Facebook: ${fbErr.message || fbErr}`, "startup");
      }
    } else if (alreadySent) {
      log(`[STARTUP] Push already sent today for ${dayKey}, skipping`, "startup");
    } else if (hourET < 6) {
      log(`[STARTUP] Before 6 AM ET (${hourET}:${nowET.getMinutes().toString().padStart(2, "0")}), skipping push notifications`, "startup");
    } else if (!contentReady) {
      log(`[STARTUP] Content generation failed, skipping push notifications`, "startup");
    }
  } catch (err: any) {
    log(`[STARTUP] Push notification check error: ${err.message || err}`, "startup");
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

    log('[STRIPE] Initializing webhook + sync...', 'stripe');
    await ensureStripeSync();
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

    const domains = process.env.REPLIT_DOMAINS || process.env.REPL_SLUG + '.replit.app';
    const webhookBaseUrl = `https://${domains.split(',')[0]}`;
    const webhookUrl = `${webhookBaseUrl}/api/stripe/webhook`;
    log(`[STRIPE] Registering webhook at: ${webhookUrl}`, 'stripe');
    await stripeSync.findOrCreateManagedWebhook(webhookUrl);
    log(`[STRIPE] Webhook configured: OK`, 'stripe');

    stripeSync.syncBackfill()
      .then(() => log('[STRIPE] Data synced', 'stripe'))
      .catch((err: any) => log(`[STRIPE] Sync error: ${err.message}`, 'stripe'));
  } catch (err: any) {
    stripeSyncReady = false;
    log(`[STRIPE] Sync init error: ${err.message || err}`, 'stripe');
  }
}
