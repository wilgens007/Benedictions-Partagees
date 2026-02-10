import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const dailyContent = pgTable("daily_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dayKey: varchar("day_key", { length: 10 }).notNull(),
  language: varchar("language", { length: 5 }).notNull().default("en"),
  verse: text("verse").notNull(),
  reference: text("reference").notNull(),
  devotional: text("devotional").notNull(),
  prayer: text("prayer").notNull(),
  encouragementText: text("encouragement_text").notNull(),
  encouragementAuthor: text("encouragement_author").notNull().default("Bénédictions Partagées"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("daily_content_day_lang_idx").on(table.dayKey, table.language),
]);

export type DailyContent = typeof dailyContent.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const prayerRequestSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  message: z.string().min(1, "Prayer request is required"),
  language: z.enum(["en", "fr", "ht"]),
  createdAt: z.string(),
});

export const insertPrayerRequestSchema = prayerRequestSchema.omit({ id: true, createdAt: true });

export type PrayerRequest = z.infer<typeof prayerRequestSchema>;
export type InsertPrayerRequest = z.infer<typeof insertPrayerRequestSchema>;

export type Language = "en" | "fr" | "ht";

export interface DailyVerse {
  id: string;
  verse: string;
  reference: string;
  devotional: string;
  prayer: string;
  date: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  audioUrl: string;
  albumArt: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  category: string;
  thumbnail?: string;
}

export interface Encouragement {
  id: string;
  text: string;
  author: string;
}
