import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, uniqueIndex, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  isPremium: boolean("is_premium").default(false),
  premiumSince: timestamp("premium_since"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type UserSession = typeof userSessions.$inferSelect;

export const savedVerses = pgTable("saved_verses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  reference: text("reference").notNull(),
  verseText: text("verse_text").notNull(),
  savedAt: timestamp("saved_at").defaultNow(),
}, (table) => [
  uniqueIndex("saved_verses_user_ref_idx").on(table.userId, table.reference),
]);

export type SavedVerse = typeof savedVerses.$inferSelect;
export const insertSavedVerseSchema = createInsertSchema(savedVerses).omit({ id: true, savedAt: true });
export type InsertSavedVerse = z.infer<typeof insertSavedVerseSchema>;

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
  shareCaption: text("share_caption"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("daily_content_day_lang_idx").on(table.dayKey, table.language),
]);

export type DailyContent = typeof dailyContent.$inferSelect;

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  language: varchar("language", { length: 5 }).default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;

export const supportConfig = pgTable("support_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SupportConfig = typeof supportConfig.$inferSelect;

export const albums = pgTable("albums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  coverUrl: text("cover_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Album = typeof albums.$inferSelect;
export const insertAlbumSchema = createInsertSchema(albums).omit({ id: true, createdAt: true });
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;

export const songs = pgTable("songs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  albumId: varchar("album_id"),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  coverUrl: text("cover_url"),
  audioUrl: text("audio_url").notNull(),
  duration: text("duration"),
  isEarlyAccess: boolean("is_early_access").default(false),
  publicReleaseAt: timestamp("public_release_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Song = typeof songs.$inferSelect;
export const insertSongSchema = createInsertSchema(songs).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSong = z.infer<typeof insertSongSchema>;

export const testimonies = pgTable("testimonies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameDisplay: text("name_display").notNull(),
  contentText: text("content_text").notNull(),
  audioUrl: text("audio_url"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Testimony = typeof testimonies.$inferSelect;
export const insertTestimonySchema = createInsertSchema(testimonies).omit({ id: true, createdAt: true, status: true, isFeatured: true });
export type InsertTestimony = z.infer<typeof insertTestimonySchema>;

export const prayerRequests = pgTable("prayer_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  language: varchar("language", { length: 5 }).notNull().default("en"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DbPrayerRequest = typeof prayerRequests.$inferSelect;
export const insertDbPrayerRequestSchema = createInsertSchema(prayerRequests).omit({ id: true, createdAt: true, status: true });
export type InsertDbPrayerRequest = z.infer<typeof insertDbPrayerRequestSchema>;

export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type AdminSession = typeof adminSessions.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const registerUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

export const loginUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
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
