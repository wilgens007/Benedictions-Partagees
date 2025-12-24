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

const musicTracks: MusicTrack[] = [
  {
    id: "1",
    title: "How Great Is Our God",
    artist: "Chris Tomlin",
    duration: "4:32",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    albumArt: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&h=300&fit=crop",
  },
  {
    id: "2",
    title: "Amazing Grace (My Chains Are Gone)",
    artist: "Chris Tomlin",
    duration: "5:18",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
  },
  {
    id: "3",
    title: "Blessed Assurance",
    artist: "Carrie Underwood",
    duration: "3:45",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    albumArt: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop",
  },
  {
    id: "4",
    title: "What A Beautiful Name",
    artist: "Hillsong Worship",
    duration: "5:42",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    albumArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
  },
  {
    id: "5",
    title: "Goodness of God",
    artist: "Bethel Music",
    duration: "4:53",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    albumArt: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop",
  },
];

const videos: Video[] = [
  {
    id: "1",
    title: "The Power of Faith in Difficult Times",
    description: "A powerful message about trusting God when facing life's greatest challenges. Learn how faith can carry you through any storm.",
    youtubeId: "dQw4w9WgXcQ",
    category: "sermons",
    thumbnail: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=400&h=225&fit=crop",
  },
  {
    id: "2",
    title: "Testimony: From Darkness to Light",
    description: "An inspiring testimony of transformation through the grace of God. Hear how one life was completely changed by faith.",
    youtubeId: "dQw4w9WgXcQ",
    category: "testimonies",
    thumbnail: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&h=225&fit=crop",
  },
  {
    id: "3",
    title: "Worship Night Live - Praise & Adoration",
    description: "Join us for an evening of powerful worship and praise. Experience the presence of God through music.",
    youtubeId: "dQw4w9WgXcQ",
    category: "worship",
    thumbnail: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=400&h=225&fit=crop",
  },
  {
    id: "4",
    title: "Understanding God's Grace",
    description: "A deep dive into what grace truly means and how it transforms our relationship with God and others.",
    youtubeId: "dQw4w9WgXcQ",
    category: "teachings",
    thumbnail: "https://images.unsplash.com/photo-1555431189-0fabf2667795?w=400&h=225&fit=crop",
  },
  {
    id: "5",
    title: "The Beatitudes: Keys to Kingdom Living",
    description: "Exploring the teachings of Jesus in the Sermon on the Mount and their practical application today.",
    youtubeId: "dQw4w9WgXcQ",
    category: "sermons",
    thumbnail: "https://images.unsplash.com/photo-1504439904031-93ded9f93e4e?w=400&h=225&fit=crop",
  },
  {
    id: "6",
    title: "My Healing Journey",
    description: "A touching testimony of physical and spiritual healing that will strengthen your faith.",
    youtubeId: "dQw4w9WgXcQ",
    category: "testimonies",
    thumbnail: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=225&fit=crop",
  },
];

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
    return musicTracks;
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
