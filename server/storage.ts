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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDailyVerse(language: Language): Promise<DailyVerse> {
    const verses = dailyVerses[language] || dailyVerses.en;
    const now = new Date();
    // Use UTC date to ensure consistency across timezones for "today"
    const todayStr = now.toISOString().split("T")[0];
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const verse = verses[dayOfYear % verses.length];
    return { ...verse, date: todayStr };
  }

  async getEncouragement(language: Language): Promise<Encouragement> {
    const msgs = encouragements[language] || encouragements.en;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return msgs[dayOfYear % msgs.length];
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
