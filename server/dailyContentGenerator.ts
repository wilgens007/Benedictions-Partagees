import { db } from "./db";
import { dailyContent } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { getVerseForDayIndex } from "./data/dailyVerses";
import { encouragements } from "./data/encouragements";
import type { Language, DailyContent } from "@shared/schema";

const LANGUAGES: Language[] = ["en", "fr", "ht"];

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
  const appUrl = process.env.REPLIT_DEPLOYMENT_URL || process.env.REPLIT_DEV_DOMAIN || "benedictionspartagees.org";
  const baseUrl = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;
  return `BP — Devotion du jour (${dayKey})\n${verse.reference} — "${excerpt}"\n\n${baseUrl}/devotion`;
}

type ContentDatabase = Pick<typeof db, "select" | "insert">;

export async function getDailyContentForDay(
  dayKey: string,
  language: Language,
  database: Pick<typeof db, "select"> = db,
): Promise<DailyContent | null> {
  const rows = await database
    .select()
    .from(dailyContent)
    .where(and(eq(dailyContent.dayKey, dayKey), eq(dailyContent.language, language)));
  return rows[0] || null;
}

export async function generateDailyContent(dayKey: string, database: ContentDatabase = db): Promise<{
  status: "created" | "already_exists";
  languages: string[];
  dayKey: string;
}> {
  const dayIndex = getDayIndex(dayKey);
  const generated: string[] = [];

  console.log(`[CRON] generateDailyContent called for dayKey=${dayKey}, dayIndex=${dayIndex}`);

  for (const lang of LANGUAGES) {
    const existing = await getDailyContentForDay(dayKey, lang, database);
    if (existing) {
      console.log(`[CRON] Content already exists for dayKey=${dayKey}, lang=${lang} — skipping`);
      continue;
    }

    const msgs = encouragements[lang] || encouragements.en;
    const verse = getVerseForDayIndex(dayIndex, lang);
    const encouragement = msgs[dayIndex % msgs.length];
    const shareCaption = generateShareCaption(verse, dayKey);

    try {
      await database.insert(dailyContent).values({
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
      // A PostgreSQL statement error aborts its transaction. Only standalone
      // generation can safely treat a unique conflict as an idempotent skip.
      if (err.code === "23505" && database === db) {
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

export async function postDailyToFacebook(): Promise<{ status: string; postId?: string; error?: string }> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId || !pageToken) {
    console.log("[FACEBOOK] Auto-post disabled: FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN not set");
    return { status: "disabled" };
  }

  try {
    const dayKey = getTodayKeyET();
    const content = await getDailyContentForDay(dayKey, "en");

    if (!content) {
      console.log("[FACEBOOK] No content for today yet, skipping auto-post");
      return { status: "no_content" };
    }

    const appUrl = process.env.PUBLIC_APP_URL || process.env.REPLIT_DEPLOYMENT_URL || process.env.REPLIT_DEV_DOMAIN || "benedictionspartagees.org";
    const baseUrl = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;
    const devotionLink = `${baseUrl}/devotion`;
    const excerpt = content.verse.length > 120 ? content.verse.substring(0, 117) + "..." : content.verse;
    const message = `BP \u2014 Devotion du jour (${dayKey})\n${content.reference} \u2014 "${excerpt}"\n\n${devotionLink}`;

    const fbResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          link: devotionLink,
          access_token: pageToken,
        }),
      }
    );

    const fbData = await fbResponse.json() as any;
    console.log(`[FACEBOOK] Post result: status=${fbResponse.status}, response=${JSON.stringify(fbData)}`);

    if (!fbResponse.ok) {
      return { status: "error", error: fbData?.error?.message || "Facebook API error" };
    }

    return { status: "posted", postId: fbData.id };
  } catch (error: any) {
    console.error("[FACEBOOK] ERROR posting:", error.message || error);
    return { status: "error", error: error.message || "Unknown error" };
  }
}
