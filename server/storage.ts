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

const dailyVerses: Record<Language, DailyVerse[]> = {
  en: [
    {
      id: "1",
      verse: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
      reference: "Jeremiah 29:11",
      devotional: "God has a beautiful plan for your life. Even when circumstances seem uncertain, trust that He is working all things together for your good. His plans are not to harm you but to give you hope. Today, rest in the assurance that your future is secure in His loving hands.",
      prayer: "Heavenly Father, thank You for the plans You have for me. Help me to trust You even when I cannot see the path ahead. Give me hope and peace as I walk in faith, knowing that You are guiding my steps. In Jesus' name, Amen.",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: "2",
      verse: "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.",
      reference: "Psalm 23:1-3",
      devotional: "Our Good Shepherd provides everything we need. He leads us to places of rest and restoration. When life feels overwhelming, remember that He is always guiding you toward peace. Let Him restore your weary soul today.",
      prayer: "Lord, You are my Shepherd. I trust You to provide for all my needs. Lead me to places of rest and peace. Restore my soul and renew my strength. Thank You for Your constant care. Amen.",
      date: new Date().toISOString().split("T")[0],
    },
  ],
  fr: [
    {
      id: "1",
      verse: "Car je connais les projets que j'ai formés sur vous, dit l'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l'espérance.",
      reference: "Jérémie 29:11",
      devotional: "Dieu a un plan magnifique pour votre vie. Même lorsque les circonstances semblent incertaines, ayez confiance qu'Il fait concourir toutes choses à votre bien. Ses plans ne sont pas pour vous faire du mal mais pour vous donner de l'espoir.",
      prayer: "Père céleste, merci pour les plans que Tu as pour moi. Aide-moi à Te faire confiance même quand je ne vois pas le chemin devant moi. Donne-moi espoir et paix alors que je marche dans la foi. Au nom de Jésus, Amen.",
      date: new Date().toISOString().split("T")[0],
    },
  ],
  ht: [
    {
      id: "1",
      verse: "Paske mwen konnen plan mwen gen pou ou yo, di Senyè a, plan pou fè ou byen, pa pou fè ou mal, plan pou ba ou espwa ak yon lavni.",
      reference: "Jeremi 29:11",
      devotional: "Bondye gen yon bèl plan pou lavi ou. Menm lè sikonstans yo sanble ensèten, fè konfyans ke Li ap travay tout bagay ansanm pou byen ou. Plan Li yo pa pou fè ou mal men pou ba ou espwa.",
      prayer: "Papa nan syèl la, mèsi pou plan Ou gen pou mwen. Ede mwen fè Ou konfyans menm lè mwen pa kapab wè chemen an devan mwen. Ban mwen espwa ak lapè pandan mwen ap mache nan lafwa. Nan non Jezi, Amèn.",
      date: new Date().toISOString().split("T")[0],
    },
  ],
};

const encouragements: Record<Language, Encouragement[]> = {
  en: [
    {
      id: "1",
      text: "God's love for you is endless and unconditional. No matter what you're facing today, know that you are never alone. The same God who parted the Red Sea and raised Jesus from the dead is walking beside you right now.",
      author: "Bénédictions Partagées",
    },
    {
      id: "2",
      text: "Take heart, beloved. Your prayers are heard, your tears are seen, and your faith moves mountains. Today is a new day filled with God's mercies that are new every morning.",
      author: "Bénédictions Partagées",
    },
  ],
  fr: [
    {
      id: "1",
      text: "L'amour de Dieu pour vous est infini et inconditionnel. Peu importe ce que vous affrontez aujourd'hui, sachez que vous n'êtes jamais seul. Le même Dieu qui a ouvert la mer Rouge marche à vos côtés maintenant.",
      author: "Bénédictions Partagées",
    },
  ],
  ht: [
    {
      id: "1",
      text: "Lanmou Bondye pou ou san limit e san kondisyon. Kèlkeswa sa ou ap fè fas jodi a, konnen ke ou pa janm pou kont ou. Menm Bondye ki te ouvri Lanmè Wouj la ap mache bò kote ou kounye a.",
      author: "Bénédictions Partagées",
    },
  ],
};

// Music tracks are loaded from server/data/songs.ts
// Videos are loaded from server/data/videos.ts
// Edit those files to add your content!

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
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return verses[dayOfYear % verses.length];
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
