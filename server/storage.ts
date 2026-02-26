import type { 
  User, 
  InsertUser, 
  PrayerRequest, 
  InsertPrayerRequest,
  DailyVerse,
  MusicTrack,
  Video,
  Encouragement,
  Language
} from "@shared/schema";
import { randomUUID } from "crypto";
import { songs } from "./data/songs";
import { videos } from "./data/videos";
import { dailyVerses } from "./data/dailyVerses";
import { encouragements } from "./data/encouragements";
import { getDailyContentForDay, getTodayKeyET, generateDailyContent } from "./dailyContentGenerator";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getDailyVerse(language: Language): Promise<DailyVerse>;
  getEncouragement(language: Language): Promise<Encouragement>;
  getMusicTracks(): Promise<MusicTrack[]>;
  getVideos(): Promise<Video[]>;
  
  createPrayerRequest(request: InsertPrayerRequest): Promise<PrayerRequest>;
  getPrayerRequests(): Promise<PrayerRequest[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private prayerRequests: Map<string, PrayerRequest>;

  constructor() {
    this.users = new Map();
    this.prayerRequests = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      email: insertUser.email ?? null,
      isPremium: false,
      premiumSince: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
    this.users.set(id, user);
    return user;
  }

  async getDailyVerse(language: Language): Promise<DailyVerse> {
    const dayKey = getTodayKeyET();

    const dbContent = await getDailyContentForDay(dayKey, language);
    if (dbContent) {
      return {
        id: dbContent.id,
        verse: dbContent.verse,
        reference: dbContent.reference,
        devotional: dbContent.devotional,
        prayer: dbContent.prayer,
        date: dbContent.dayKey,
      };
    }

    console.log(`[STORAGE] No DB content for dayKey=${dayKey}, lang=${language} — generating now`);
    await generateDailyContent(dayKey);

    const freshContent = await getDailyContentForDay(dayKey, language);
    if (freshContent) {
      return {
        id: freshContent.id,
        verse: freshContent.verse,
        reference: freshContent.reference,
        devotional: freshContent.devotional,
        prayer: freshContent.prayer,
        date: freshContent.dayKey,
      };
    }

    const verses = dailyVerses[language] || dailyVerses.en;
    return { ...verses[0], date: dayKey };
  }

  async getEncouragement(language: Language): Promise<Encouragement> {
    const dayKey = getTodayKeyET();

    const dbContent = await getDailyContentForDay(dayKey, language);
    if (dbContent) {
      return {
        id: dbContent.id,
        text: dbContent.encouragementText,
        author: dbContent.encouragementAuthor,
      };
    }

    console.log(`[STORAGE] No DB encouragement for dayKey=${dayKey}, lang=${language} — generating now`);
    await generateDailyContent(dayKey);

    const freshContent = await getDailyContentForDay(dayKey, language);
    if (freshContent) {
      return {
        id: freshContent.id,
        text: freshContent.encouragementText,
        author: freshContent.encouragementAuthor,
      };
    }

    const msgs = encouragements[language] || encouragements.en;
    return msgs[0];
  }

  async getMusicTracks(): Promise<MusicTrack[]> {
    return songs;
  }

  async getVideos(): Promise<Video[]> {
    return videos;
  }

  async createPrayerRequest(insert: InsertPrayerRequest): Promise<PrayerRequest> {
    const id = randomUUID();
    const request: PrayerRequest = {
      ...insert,
      id,
      createdAt: new Date().toISOString(),
    };
    this.prayerRequests.set(id, request);
    return request;
  }

  async getPrayerRequests(): Promise<PrayerRequest[]> {
    return Array.from(this.prayerRequests.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export const storage = new MemStorage();
