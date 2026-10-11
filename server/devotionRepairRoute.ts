import type { Express } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { dailyContent } from "@shared/schema";
import { db } from "./db";
import { generateDailyContent } from "./dailyContentGenerator";

export async function repairDailyContentForDay(dayKey: string) {
  return db.transaction(async transaction => {
    // Notification markers share this table and day key. Only replace content
    // languages; never delete marker rows or content from another date.
    await transaction.delete(dailyContent).where(and(
      eq(dailyContent.dayKey, dayKey),
      inArray(dailyContent.language, ["en", "fr", "ht"]),
    ));
    const regenerated = await generateDailyContent(dayKey, transaction);
    return { repairedDay: dayKey, regenerated };
  });
}

interface DevotionRepairDependencies {
  getCronSecret: () => string | undefined;
  getTodayKeyET: () => string;
  repairDailyContentForDay: typeof repairDailyContentForDay;
}

export function registerDevotionRepairRoute(
  app: Express,
  dependencies: DevotionRepairDependencies,
): void {
  app.post("/api/admin/daily-content-repair-today", async (req, res) => {
    const cronSecret = dependencies.getCronSecret();
    const providedSecret = req.headers["x-cron-secret"];
    if (!cronSecret || !providedSecret || providedSecret !== cronSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // The request cannot choose a historical date to delete.
      const result = await dependencies.repairDailyContentForDay(dependencies.getTodayKeyET());
      res.json(result);
    } catch (err: any) {
      console.error("[ADMIN] daily-content-repair-today error:", err);
      res.status(500).json({ error: "Today's content repair failed" });
    }
  });
}
