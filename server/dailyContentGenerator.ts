import { db } from "./db";
import { dailyContent } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { dailyVerses } from "./data/dailyVerses";
import { encouragements } from "./data/encouragements";
import type { Language, DailyContent } from "@shared/schema";

const LANGUAGES: Language[] = ["en", "fr", "ht"];

export function getTodayKeyET(): string {
  const now = new Date();
  const etStr = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const etDate = new Date(etStr);
  const year = etDate.getFullYear();
  const month = String(etDate.getMonth() + 1).padStart(2, "0");
  const day = String(etDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayIndex(dayKey: string): number {
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const start = new Date(year, 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export async function getDailyContentForDay(dayKey: string, language: Language): Promise<DailyContent | null> {
  const rows = await db
    .select()
    .from(dailyContent)
    .where(and(eq(dailyContent.dayKey, dayKey), eq(dailyContent.language, language)));
  return rows[0] || null;
}

export async function generateDailyContent(dayKey: string): Promise<{
  status: "created" | "already_exists";
  languages: string[];
  dayKey: string;
}> {
  const dayIndex = getDayIndex(dayKey);
  const generated: string[] = [];

  console.log(`[CRON] generateDailyContent called for dayKey=${dayKey}, dayIndex=${dayIndex}`);

  for (const lang of LANGUAGES) {
    const existing = await getDailyContentForDay(dayKey, lang);
    if (existing) {
      console.log(`[CRON] Content already exists for dayKey=${dayKey}, lang=${lang} — skipping`);
      continue;
    }

    const verses = dailyVerses[lang] || dailyVerses.en;
    const msgs = encouragements[lang] || encouragements.en;
    const verse = verses[dayIndex % verses.length];
    const encouragement = msgs[dayIndex % msgs.length];

    try {
      await db.insert(dailyContent).values({
        dayKey,
        language: lang,
        verse: verse.verse,
        reference: verse.reference,
        devotional: verse.devotional,
        prayer: verse.prayer,
        encouragementText: encouragement.text,
        encouragementAuthor: encouragement.author,
      });
      console.log(`[CRON] Created daily content for dayKey=${dayKey}, lang=${lang}`);
      generated.push(lang);
    } catch (err: any) {
      if (err.code === "23505") {
        console.log(`[CRON] Duplicate key conflict for dayKey=${dayKey}, lang=${lang} — already exists (race condition safe)`);
      } else {
        console.error(`[CRON] ERROR inserting daily content for dayKey=${dayKey}, lang=${lang}:`, err);
        throw err;
      }
    }
  }

  const status = generated.length > 0 ? "created" : "already_exists";
  console.log(`[CRON] Generation result for dayKey=${dayKey}: status=${status}, languages=${generated.join(",") || "none (all existed)"}`);

  return { status, languages: generated, dayKey };
}
