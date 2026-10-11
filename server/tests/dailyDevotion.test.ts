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
      reference: "Genèse 1:1", verse: "Au commencement, Dieu créa les cieux et la terre.",
    });
    expect(memory.rows.get(`${FIXED_DAY}|ht`)).toMatchObject({
      reference: "Jenèz 1:1", verse: "Nan konmansman, Bondye kreye syèl la ak tè a.",
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
