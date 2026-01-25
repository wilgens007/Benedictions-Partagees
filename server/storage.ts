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

  private getDayOfYear(date: Date): number {
    // Eastern Time is UTC-5 (EST) or UTC-4 (EDT)
    // To handle "6 am Eastern Time", we shift the date by 5 hours (using EST as base)
    // so that 6am ET becomes 1am UTC, or more simply, we can just use the adjusted time.
    
    // A more robust way: Adjust date to Eastern Time then subtract 6 hours.
    // This way, the "day" flips at 6am ET.
    const etDate = new Date(date.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const shiftedDate = new Date(etDate.getTime() - (6 * 60 * 60 * 1000));
    
    const start = new Date(shiftedDate.getFullYear(), 0, 0);
    const diff = shiftedDate.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  async getDailyVerse(language: Language): Promise<DailyVerse> {
    const verses = dailyVerses[language] || dailyVerses.en;
    const now = new Date();
    const dayIndex = this.getDayOfYear(now);
    const verse = verses[dayIndex % verses.length];
    const dateStr = now.toISOString().split("T")[0];
    return { ...verse, date: dateStr };
  }

  async getEncouragement(language: Language): Promise<Encouragement> {
    const msgs = encouragements[language] || encouragements.en;
    const dayIndex = this.getDayOfYear(new Date());
    return msgs[dayIndex % msgs.length];
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
