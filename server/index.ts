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
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const jsonStr = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${jsonStr.length > 200 ? jsonStr.slice(0, 200) + '...' : jsonStr}`;
      }
      capturedJsonResponse = undefined;
      log(logLine);
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

    res.status(status).json({ message });
    throw err;
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

  try {
    const { db: fixDb } = await import("./db");
    const { songs: songsTable } = await import("@shared/schema");
    const { like } = await import("drizzle-orm");
    const sunoSongs = await fixDb.select().from(songsTable).where(like(songsTable.audioUrl, '%suno.com/s/%'));
    for (const song of sunoSongs) {
      if (song.audioUrl) {
        try {
          const resp = await fetch(song.audioUrl, { method: "HEAD", redirect: "follow" });
          const uuidMatch = resp.url.match(/song\/([0-9a-f-]{36})/);
          if (uuidMatch) {
            const cdnUrl = `https://cdn1.suno.ai/${uuidMatch[1]}.mp3`;
            const { eq } = await import("drizzle-orm");
            await fixDb.update(songsTable).set({ audioUrl: cdnUrl }).where(eq(songsTable.id, song.id));
            log(`[STARTUP] Fixed Suno URL for song "${song.title}": ${cdnUrl}`, "startup");
          }
        } catch (err: any) {
          log(`[STARTUP] Failed to resolve Suno URL for "${song.title}": ${err.message}`, "startup");
        }
      }
    }
    const sunoSongs2 = await fixDb.select().from(songsTable).where(like(songsTable.audioUrl, '%suno.com/song/%'));
    for (const song of sunoSongs2) {
      if (song.audioUrl) {
        const uuidMatch = song.audioUrl.match(/song\/([0-9a-f-]{36})/);
        if (uuidMatch && !song.audioUrl.includes("cdn1.suno.ai")) {
          const cdnUrl = `https://cdn1.suno.ai/${uuidMatch[1]}.mp3`;
          const { eq } = await import("drizzle-orm");
          await fixDb.update(songsTable).set({ audioUrl: cdnUrl }).where(eq(songsTable.id, song.id));
          log(`[STARTUP] Fixed Suno song URL for "${song.title}": ${cdnUrl}`, "startup");
        }
      }
    }
  } catch (err: any) {
    log(`[STARTUP] Suno URL fix: ${err.message || err}`, "startup");
  }

  try {
    const { runMigrations } = await import('stripe-replit-sync');
    const { getStripeSync } = await import('./stripeClient');

    log('[STRIPE] Initializing Stripe schema...', 'stripe');
    await runMigrations({ databaseUrl: process.env.DATABASE_URL! });
    log('[STRIPE] Schema ready', 'stripe');

    const stripeSync = await getStripeSync();

    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const webhookResult = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`
    );
    log(`[STRIPE] Webhook configured: ${webhookResult?.webhook?.url || 'OK'}`, 'stripe');

    stripeSync.syncBackfill()
      .then(() => log('[STRIPE] Data synced', 'stripe'))
      .catch((err: any) => log(`[STRIPE] Sync error: ${err.message}`, 'stripe'));

    const { seedStripeProducts } = await import('./seedProducts');
    await seedStripeProducts();
  } catch (err: any) {
    log(`[STRIPE] Init error: ${err.message || err}`, 'stripe');
  }
}
