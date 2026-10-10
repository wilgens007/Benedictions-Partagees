import type { Express } from "express";

export interface DevotionGenerationDependencies {
  getCronSecret: () => string | undefined;
  getTodayKeyET: () => string;
  generateDailyContent: (dayKey: string) => Promise<{
    status: "created" | "already_exists";
    dayKey: string;
    languages: string[];
  }>;
}

// Keep registration independent of database initialization so isolated tests
// exercise the same HTTP handler used by the application.
export function registerDevotionGenerationRoute(
  app: Express,
  dependencies: DevotionGenerationDependencies,
): void {
  app.post("/api/devotion/generate", async (req, res) => {
    const cronSecret = dependencies.getCronSecret();
    const providedSecret = req.headers["x-cron-secret"] as string;

    console.log(`[CRON-ENDPOINT] POST /api/devotion/generate called at ${new Date().toISOString()}`);

    if (!cronSecret) {
      console.error("[CRON-ENDPOINT] ERROR: CRON_SECRET env var is not set on the server");
      return res.status(500).json({ error: "Server misconfiguration: CRON_SECRET not set" });
    }

    if (!providedSecret || providedSecret !== cronSecret) {
      console.warn("[CRON-ENDPOINT] UNAUTHORIZED: Invalid or missing X-CRON-SECRET header");
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const dayKey = dependencies.getTodayKeyET();
      console.log(`[CRON-ENDPOINT] Computed dayKey=${dayKey} (America/New_York)`);

      const result = await dependencies.generateDailyContent(dayKey);

      console.log(`[CRON-ENDPOINT] Result: status=${result.status}, dayKey=${result.dayKey}, languages=${result.languages.join(",") || "none"}`);
      res.json(result);
    } catch (error: any) {
      console.error("[CRON-ENDPOINT] ERROR during generation:", error.message || error);
      res.status(500).json({ error: "Generation failed", details: error.message });
    }
  });
}
