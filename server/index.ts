import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import cron from "node-cron";
import { generateDailyContent, getTodayKeyET } from "./dailyContentGenerator";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

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
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
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
    log(`[CRON-BACKUP] node-cron triggered at ${new Date().toISOString()} — dayKey=${dayKey}`, "cron");
    try {
      const result = await generateDailyContent(dayKey);
      log(`[CRON-BACKUP] Result: status=${result.status}, dayKey=${result.dayKey}`, "cron");
    } catch (err: any) {
      log(`[CRON-BACKUP] ERROR: ${err.message || err}`, "cron");
    }
  }, {
    timezone: "America/New_York",
  });
  log("[CRON-BACKUP] node-cron scheduled for 6:00 AM America/New_York daily", "cron");

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
}
