import { db } from "./db";
import { dailyContent } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { dailyVerses } from "./data/dailyVerses";
import { encouragements } from "./data/encouragements";
import type { Language, DailyContent } from "@shared/schema";
import { sendPushToAll } from "./pushService";

const LANGUAGES: Language[] = ["en", "fr", "ht"];

function isWithinNotificationWindow(): boolean {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  let hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  if (hour === 24) hour = 0;
  const timeInMinutes = hour * 60 + minute;
  return timeInMinutes >= 330 && timeInMinutes < 1260;
}

export function getTodayKeyET(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function getDayIndex(dayKey: string): number {
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const start = new Date(year, 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function generateShareCaption(verse: { verse: string; reference: string }, dayKey: string): string {
  const excerpt = verse.verse.length > 120 ? verse.verse.substring(0, 117) + "..." : verse.verse;
  return `BP — Devotion du jour (${dayKey})\n${verse.reference} — "${excerpt}"\nLire: https://benedictionspartagees.org/devotion`;
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
    const shareCaption = generateShareCaption(verse, dayKey);

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
        shareCaption,
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

  if (status === "created") {
    if (isWithinNotificationWindow()) {
      console.log(`[CRON] New content created — triggering push notifications (within 5 AM–9 PM ET window)`);
      try {
        const pushResult = await sendPushToAll({
          title: "BP — Devotion du jour",
          body: "Le verset et la m\u00e9ditation d'aujourd'hui sont pr\u00eats. Touchez pour lire.",
          url: "/devotion",
        });
        console.log(`[CRON] Push notification results: sent=${pushResult.sent}, failed=${pushResult.failed}, cleaned=${pushResult.cleaned}`);
      } catch (pushErr: any) {
        console.error(`[CRON] ERROR sending push notifications: ${pushErr.message || pushErr}`);
      }
    } else {
      console.log(`[CRON] New content created but outside notification window (5 AM–9 PM ET) — skipping push notifications`);
    }
  }

  return { status, languages: generated, dayKey };
}
