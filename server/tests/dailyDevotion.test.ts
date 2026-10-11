import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { request } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { getTableConfig } from "drizzle-orm/pg-core";
import { dailyContent } from "../../shared/schema";
import { memory } from "./isolation";
import { generateDailyContent, getTodayKeyET } from "../dailyContentGenerator";
import { registerDevotionGenerationRoute } from "../devotionGenerationRoute";
import { registerDevotionRepairRoute, repairDailyContentForDay } from "../devotionRepairRoute";
import { assertAlignedVerseCorpus, canonicalPassageRotation, dailyVerses, getVerseForDayIndex } from "../data/dailyVerses";
import { getPassageId } from "../data/passageIdentity";
import { versesEN } from "../data/verses-en";
import { versesFR } from "../data/verses-fr";
import { versesHT } from "../data/verses-ht";

const TEST_SECRET = "isolated-test-only-not-a-real-credential";
const FIXED_DAY = "2026-10-10";
let cronSecret: string | undefined;
let server: Server;
const generate = vi.fn(generateDailyContent);
const repair = vi.fn(repairDailyContentForDay);

beforeAll(async () => {
  const app = express();
  registerDevotionGenerationRoute(app, {
    getCronSecret: () => cronSecret,
    getTodayKeyET,
    generateDailyContent: generate,
  });
  registerDevotionRepairRoute(app, {
    getCronSecret: () => cronSecret,
    getTodayKeyET,
    repairDailyContentForDay: repair,
  });
  await new Promise<void>((resolve, reject) => {
    server = app.listen(0, "127.0.0.1", resolve);
    server.once("error", reject);
  });
});

beforeEach(() => {
  cronSecret = TEST_SECRET;
  generate.mockClear();
  repair.mockClear();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
  vi.unstubAllGlobals();
});

// Only the ephemeral loopback test server is contacted, never the published app.
async function postGeneration(secret?: string, path = "/api/devotion/generate") {
  const port = (server.address() as AddressInfo).port;
  return new Promise<{ status: number; body: any }>((resolve, reject) => {
    const req = request({
      hostname: "127.0.0.1",
      port,
      path,
      method: "POST",
      headers: secret === undefined ? {} : { "X-CRON-SECRET": secret },
    }, res => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", chunk => { body += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode!, body: JSON.parse(body) });
        } catch (error) {
          reject(error);
        }
      });
      res.on("error", reject);
    });
    req.setTimeout(5_000, () => req.destroy(new Error("Test HTTP request timed out")));
    req.on("error", reject);
    req.end();
  });
}

function freezeDate(iso: string) {
  // Leave real I/O timers running for HTTP tests.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(iso));
}

describe("Eastern calendar day", () => {
  it.each([
    ["winter before midnight", "2026-01-15T04:59:59.999Z", "2026-01-14"],
    ["winter at midnight", "2026-01-15T05:00:00.000Z", "2026-01-15"],
    ["summer before midnight", "2026-07-15T03:59:59.999Z", "2026-07-14"],
    ["summer at midnight", "2026-07-15T04:00:00.000Z", "2026-07-15"],
    ["spring before clock jump", "2026-03-08T06:59:59.999Z", "2026-03-08"],
    ["spring after clock jump", "2026-03-08T07:00:00.000Z", "2026-03-08"],
    ["fall first 1:30 AM", "2026-11-01T05:30:00.000Z", "2026-11-01"],
    ["fall repeated 1:30 AM", "2026-11-01T06:30:00.000Z", "2026-11-01"],
    ["year boundary before midnight", "2027-01-01T04:59:59.999Z", "2026-12-31"],
    ["year boundary at midnight", "2027-01-01T05:00:00.000Z", "2027-01-01"],
  ])("%s", (_label, instant, dayKey) => {
    freezeDate(instant);
    expect(getTodayKeyET()).toBe(dayKey);
  });
});

describe("shared Bible passage corpus", () => {
  it("keeps all 365 rotation slots aligned by book, chapter, verse and range", () => {
    expect(canonicalPassageRotation).toHaveLength(365);
    expect(dailyVerses).toEqual({ en: versesEN, fr: versesFR, ht: versesHT });
    for (const language of ["en", "fr", "ht"] as const) {
      const verses = dailyVerses[language];
      expect(verses).toHaveLength(365);
      expect(new Set(verses.map(verse => verse.id)).size).toBe(365);
      for (const [index, verse] of verses.entries()) {
        expect(verse.id).toBe(String(index + 1));
        expect(verse.passageId).toBe(canonicalPassageRotation[index]);
        expect(getPassageId(verse.reference, language)).toBe(verse.passageId);
        for (const field of ["verse", "reference", "devotional", "prayer"] as const) {
          expect(verse[field].trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it.each([
    [55, "Psalm 3:3", "Psaume 3:3", "Sòm 3:3"],
    [70, "Psalm 29:11", "Psaume 29:11", "Sòm 29:11"],
    [97, "Zechariah 4:6", "Zacharie 4:6", "Zakari 4:6"],
    [108, "Hebrews 12:2", "Hébreux 12:2", "Ebre 12:2"],
    [215, "2 Corinthians 3:18", "2 Corinthiens 3:18", "2 Korentyen 3:18"],
    [257, "Romans 1:16", "Romains 1:16", "Women 1:16"],
    [276, "Ruth 1:16", "Ruth 1:16", "Rit 1:16"],
    [283, "Psalm 1:1", "Psaume 1:1", "Sòm 1:1"],
    [332, "Revelation 1:8", "Apocalypse 1:8", "Revelasyon 1:8"],
    [336, "Daniel 3:17", "Daniel 3:17", "Danyèl 3:17"],
    [358, "Song of Solomon 4:7", "Cantique des cantiques 4:7", "Kantik Salomon 4:7"],
    [363, "Philippians 4:23", "Philippiens 4:23", "Filipyen 4:23"],
  ])("retains the English passage and supplies localized references at index %i", (index, en, fr, ht) => {
    expect(["en", "fr", "ht"].map(lang => getVerseForDayIndex(Number(index), lang as "en" | "fr" | "ht").reference))
      .toEqual([en, fr, ht]);
  });

  it("supplies real replacement text, rather than relabeling unrelated verses", () => {
    expect(versesFR[55].verse).toContain("tu es mon bouclier");
    expect(versesFR[215].verse).toContain("transformés en la même image");
    expect(versesFR[257].verse).toContain("point honte de l'Évangile");
    expect(versesHT[72].verse).toContain("Nou se travay Bondye");
    expect(versesHT[169].verse).toContain("limyè nou klere");
    expect(versesHT[217].verse).toContain("bon gadò");
    expect(versesHT[218].verse).toContain("San lafwa");
    expect(versesHT[220].verse).toContain("lavi an abondans");
    expect(versesHT[258].verse).toContain("siye tout dlo");
    expect(versesHT[300].verse).toContain("vin pi piti");
    expect(versesHT[332].verse).toContain("Alfa ak Omega");
    expect(versesHT[363].verse).toBe("Se pou gras Senyè Jezi Kris la avèk lespri nou.");
    expect(versesHT[364].verse).toBe("Se pou gras Senyè Jezi Kris la avèk nou tout. Amèn.");
    // Genesis remains Genesis in its own slot, with its own original text.
    expect(versesFR[17]).toMatchObject({
      reference: "Genèse 1:1", verse: "Au commencement, Dieu créa les cieux et la terre.",
    });
    expect(versesHT[17]).toMatchObject({
      reference: "Jenèz 1:1", verse: "Nan konmansman, Bondye kreye syèl la ak tè a.",
    });
  });

  it.each(["Genèse 1:1", "Psaume 1:2", "Psaume 1:1-2"])(
    "rejects mismatched book/verse/range instead of silently relabeling %s", reference => {
      const fr = [...versesFR];
      fr[283] = { ...fr[283], reference, passageId: getPassageId(reference, "fr") };
      expect(() => assertAlignedVerseCorpus({ ...dailyVerses, fr })).toThrow("Bible passage mismatch");
    },
  );

  it("rejects a missing translation, unknown reference, or forged passage identity", () => {
    expect(() => assertAlignedVerseCorpus({ ...dailyVerses, ht: versesHT.slice(1) }))
      .toThrow("length mismatch");
    expect(() => assertAlignedVerseCorpus({ en: [], fr: [], ht: [] })).toThrow("must not be empty");
    expect(() => getPassageId("Unknown 1:1", "en")).toThrow("Unknown Bible passage");
    const fr = [...versesFR];
    fr[283] = { ...fr[283], reference: "Genèse 1:1" };
    expect(() => assertAlignedVerseCorpus({ ...dailyVerses, fr })).toThrow("Bible passage mismatch");
  });

  it("uses the same rotation for every day index, including leap-day and wraparound indices", () => {
    for (let dayIndex = 0; dayIndex <= 732; dayIndex++) {
      const expected = canonicalPassageRotation[dayIndex % 365];
      for (const language of ["en", "fr", "ht"] as const) {
        expect(getVerseForDayIndex(dayIndex, language).passageId).toBe(expected);
      }
    }
    for (const dayIndex of [-1, 0.5, NaN, Infinity]) {
      expect(() => getVerseForDayIndex(dayIndex, "en")).toThrow("Invalid Bible passage day index");
    }
  });
});

describe("daily passage selection", () => {
  it.each([2026, 2028])("generates matching translated passages throughout calendar year %i", async year => {
    for (let day = 1; day <= (year === 2028 ? 366 : 365); day++) {
      const date = new Date(year, 0, day);
      const key = `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      await generateDailyContent(key);
      const selected: string[] = [];
      for (const language of ["en", "fr", "ht"] as const) {
        const row = memory.rows.get(`${key}|${language}`)!;
        const identity = getPassageId(String(row.reference), language);
        selected.push(identity);
        const source = dailyVerses[language].find(verse =>
          verse.passageId === identity && verse.verse === row.verse);
        expect(source).toBeDefined();
        expect(row.devotional).toBe(source!.devotional);
        expect(row.prayer).toBe(source!.prayer);
        expect(row.shareCaption).toContain(row.reference);
      }
      expect(new Set(selected).size).toBe(1);
    }
    expect(memory.rows.size).toBe((year === 2028 ? 366 : 365) * 3);
  });

  it("never rewrites existing cached languages, historical days or notification markers", async () => {
    const rows = [
      { dayKey: "2026-10-09", language: "en", verse: "historical content", reference: "old reference" },
      { dayKey: FIXED_DAY, language: "fr", verse: "approved cached content", reference: "Genèse 1:1" },
      { dayKey: FIXED_DAY, language: "_ps", verse: "push bookkeeping" },
      { dayKey: FIXED_DAY, language: "_fb", verse: "Facebook bookkeeping" },
    ];
    for (const row of rows) memory.rows.set(`${row.dayKey}|${row.language}`, row);
    expect((await generateDailyContent(FIXED_DAY)).languages).toEqual(["en", "ht"]);
    for (const row of rows) expect(memory.rows.get(`${row.dayKey}|${row.language}`)).toEqual(row);
    expect(memory.deletes).toBe(0);
  });
});

describe("today-only content repair", () => {
  const path = "/api/admin/daily-content-repair-today";

  function seedContent() {
    for (const dayKey of ["2026-10-09", FIXED_DAY, "2026-10-11"]) {
      for (const language of ["en", "fr", "ht", "_ps", "_fb"]) {
        memory.rows.set(`${dayKey}|${language}`, {
          dayKey, language, verse: "old cached text", reference: "old cached reference",
        });
      }
    }
    return new Map(memory.rows);
  }

  it.each([undefined, "", "incorrect-test-secret"])("rejects unauthorized repair (%s) without deleting data", async secret => {
    const before = seedContent();
    const response = await postGeneration(secret, path);
    expect(response.status).toBe(401);
    expect(repair).not.toHaveBeenCalled();
    expect(memory.deletes).toBe(0);
    expect(memory.rows).toEqual(before);
  });

  it("rejects repair when the server secret is not configured", async () => {
    cronSecret = undefined;
    const before = seedContent();
    expect((await postGeneration(TEST_SECRET, path)).status).toBe(401);
    expect(memory.rows).toEqual(before);
    expect(memory.deletes).toBe(0);
  });

  it("repairs only today's content languages, preserving history, future rows, and markers", async () => {
    freezeDate("2026-10-11T03:59:59.999Z");
    const before = seedContent();
    // A caller-supplied date must not broaden the deletion scope.
    const response = await postGeneration(TEST_SECRET, `${path}?dayKey=2026-10-09`);
    expect(response).toEqual({
      status: 200,
      body: {
        repairedDay: FIXED_DAY,
        regenerated: { status: "created", dayKey: FIXED_DAY, languages: ["en", "fr", "ht"] },
      },
    });
    expect(repair).toHaveBeenCalledWith(FIXED_DAY);
    expect(memory.rows.size).toBe(before.size);
    for (const [key, row] of before) {
      if (row.dayKey !== FIXED_DAY || row.language.startsWith("_")) {
        expect(memory.rows.get(key)).toEqual(row);
      }
    }
    expect(memory.rows.get(`${FIXED_DAY}|en`)).toMatchObject({
      reference: "Psalm 1:1",
      verse: "Blessed is the man that walketh not in the counsel of the ungodly, nor standeth in the way of sinners, nor sitteth in the seat of the scornful.",
    });
    expect(memory.rows.get(`${FIXED_DAY}|fr`)).toMatchObject({
      reference: "Psaume 1:1",
      verse: "Heureux l'homme qui ne marche pas selon le conseil des méchants, qui ne s'arrête pas sur la voie des pécheurs, et qui ne s'assied pas en compagnie des moqueurs.",
    });
    expect(memory.rows.get(`${FIXED_DAY}|ht`)).toMatchObject({
      reference: "Sòm 1:1",
      verse: "Ala bon sa bon pou moun ki pa mache dapre konsèy mechan yo, ki pa kanpe sou chemen pechè yo, ki pa chita ansanm ak moun k ap pase lòt moun nan betiz.",
    });
    const repaired = new Map(memory.rows);
    expect((await postGeneration(TEST_SECRET, path)).status).toBe(200);
    expect(memory.rows).toEqual(repaired);
  });

  it("rolls back the deletion and partial regeneration if storage fails", async () => {
    freezeDate("2026-10-10T10:00:00.000Z");
    const before = seedContent();
    memory.failLanguage = "fr";
    const response = await postGeneration(TEST_SECRET, path);
    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Today's content repair failed");
    expect(memory.rows).toEqual(before);
    memory.failLanguage = null;
    expect((await postGeneration(TEST_SECRET, path)).status).toBe(200);
    expect(memory.rows.size).toBe(before.size);
  });

  it("does not claim repair succeeded after a transaction-aborting unique conflict", async () => {
    freezeDate("2026-10-10T10:00:00.000Z");
    const before = seedContent();
    memory.failLanguage = "fr";
    memory.failCode = "23505";
    expect((await postGeneration(TEST_SECRET, path)).status).toBe(500);
    expect(memory.rows).toEqual(before);
  });
});

describe("daily content idempotency", () => {
  it("declares a unique day/language index in the real schema", () => {
    const index = getTableConfig(dailyContent).indexes.find(
      item => item.config.name === "daily_content_day_lang_idx",
    );
    expect(index?.config.unique).toBe(true);
    expect(index?.config.columns.map(column => "name" in column ? column.name : null))
      .toEqual(["day_key", "language"]);
  });

  it("creates one devotion per language and leaves repeated generations unchanged", async () => {
    expect(await generateDailyContent(FIXED_DAY)).toEqual({
      status: "created", dayKey: FIXED_DAY, languages: ["en", "fr", "ht"],
    });
    const original = [...memory.rows.entries()];
    expect(await generateDailyContent(FIXED_DAY)).toEqual({
      status: "already_exists", dayKey: FIXED_DAY, languages: [],
    });
    expect([...memory.rows.entries()]).toEqual(original);
    expect(memory.insertAttempts).toBe(3);
  });

  it("fills only a missing language without replacing existing content", async () => {
    await generateDailyContent(FIXED_DAY);
    memory.rows.delete(`${FIXED_DAY}|fr`);
    const originalEnglish = memory.rows.get(`${FIXED_DAY}|en`);
    expect((await generateDailyContent(FIXED_DAY)).languages).toEqual(["fr"]);
    expect(memory.rows.get(`${FIXED_DAY}|en`)).toBe(originalEnglish);
    expect(memory.rows.size).toBe(3);
  });

  it("recovers from concurrent readers hitting the unique constraint", async () => {
    const results = await Promise.all(Array.from({ length: 8 }, () => generateDailyContent(FIXED_DAY)));
    expect(memory.rows.size).toBe(3);
    expect(memory.duplicates).toBeGreaterThan(0);
    expect(results.flatMap(result => result.languages).sort()).toEqual(["en", "fr", "ht"]);
    expect(results.every(result => result.dayKey === FIXED_DAY)).toBe(true);
  });

  it("does not suppress non-duplicate errors and safely retries partial generation", async () => {
    memory.failLanguage = "fr";
    await expect(generateDailyContent(FIXED_DAY)).rejects.toThrow("Isolated storage unavailable");
    expect(memory.rows.size).toBe(1);
    memory.failLanguage = null;
    expect((await generateDailyContent(FIXED_DAY)).languages).toEqual(["fr", "ht"]);
    expect(memory.rows.size).toBe(3);
  });
});

describe("POST /api/devotion/generate", () => {
  it.each([undefined, "", "incorrect-test-secret"])("rejects missing/incorrect authorization (%s)", async secret => {
    const result = await postGeneration(secret);
    expect(result).toEqual({ status: 401, body: { error: "Unauthorized" } });
    expect(generate).not.toHaveBeenCalled();
    expect(memory.reads).toBe(0);
    expect(memory.insertAttempts).toBe(0);
  });

  it("fails closed when the server cron secret is not configured", async () => {
    cronSecret = undefined;
    const result = await postGeneration(TEST_SECRET);
    expect(result.status).toBe(500);
    expect(result.body.error).toContain("CRON_SECRET not set");
    expect(generate).not.toHaveBeenCalled();
    expect(memory.rows.size).toBe(0);
  });

  it("accepts the valid header and uses the Eastern day, not the UTC day", async () => {
    freezeDate("2026-10-11T03:59:59.999Z");
    const result = await postGeneration(TEST_SECRET);
    expect(result).toEqual({
      status: 200,
      body: { status: "created", dayKey: FIXED_DAY, languages: ["en", "fr", "ht"] },
    });
    expect(generate).toHaveBeenCalledWith(FIXED_DAY);
  });

  it.each(["2026-03-08", "2026-11-01"])("keeps both scheduled UTC triggers idempotent on %s", async day => {
    freezeDate(`${day}T10:00:00.000Z`);
    const first = await postGeneration(TEST_SECRET);
    freezeDate(`${day}T11:00:00.000Z`);
    const second = await postGeneration(TEST_SECRET);
    expect(first.body).toEqual({ status: "created", dayKey: day, languages: ["en", "fr", "ht"] });
    expect(second).toEqual({
      status: 200, body: { status: "already_exists", dayKey: day, languages: [] },
    });
    expect(memory.rows.size).toBe(3);
    expect(memory.insertAttempts).toBe(3);
  });

  it("handles simultaneous authorized HTTP requests without duplicate content", async () => {
    freezeDate("2026-10-10T10:00:00.000Z");
    const responses = await Promise.all(Array.from({ length: 8 }, () => postGeneration(TEST_SECRET)));
    expect(responses.every(result => result.status === 200)).toBe(true);
    expect(responses.flatMap(result => result.body.languages).sort()).toEqual(["en", "fr", "ht"]);
    expect(memory.rows.size).toBe(3);
    expect(generate).toHaveBeenCalledTimes(8);
  });

  it("creates a separate day's content only when Eastern midnight is reached", async () => {
    freezeDate("2026-10-11T03:59:59.999Z");
    expect((await postGeneration(TEST_SECRET)).body.dayKey).toBe("2026-10-10");
    freezeDate("2026-10-11T04:00:00.000Z");
    expect((await postGeneration(TEST_SECRET)).body.dayKey).toBe("2026-10-11");
    expect(memory.rows.size).toBe(6);
  });

  it("returns a failure rather than claiming success when storage fails", async () => {
    freezeDate("2026-10-10T10:00:00.000Z");
    memory.failLanguage = "en";
    const result = await postGeneration(TEST_SECRET);
    expect(result.status).toBe(500);
    expect(result.body.error).toBe("Generation failed");
    expect(memory.rows.size).toBe(0);
  });
});
