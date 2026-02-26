import { db } from "./db";
import { albums, songs, testimonies, prayerRequests, genres, moods } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedAdminData() {
  const existingAlbums = await db.select({ count: sql<number>`count(*)` }).from(albums);
  if (Number(existingAlbums[0].count) > 0) {
    console.log("[SEED] Data already exists, skipping seed");
    return;
  }

  console.log("[SEED] Seeding sample admin data...");

  const [album] = await db.insert(albums).values({
    title: "RNB Creole Psalm",
    artist: "Bénédictions Partagées Music",
    coverUrl: "https://cdn2.suno.ai/image_c4b82a31-e59b-4bfd-9445-4fa64a5b2b5b.jpeg",
  }).returning();

  await db.insert(songs).values([
    {
      albumId: album.id,
      title: "Fondasyon Benediksyon",
      artist: "Bénédictions Partagées Music",
      coverUrl: "https://cdn2.suno.ai/image_c4b82a31-e59b-4bfd-9445-4fa64a5b2b5b.jpeg",
      audioUrl: "https://cdn1.suno.ai/c4b82a31-e59b-4bfd-9445-4fa64a5b2b5b.mp3",
      duration: "2:54",
      isEarlyAccess: false,
    },
    {
      albumId: album.id,
      title: "Chemen Lavi (Psalm 1)",
      artist: "Bénédictions Partagées Music",
      coverUrl: "https://cdn2.suno.ai/image_754977c5-e4a5-4064-a140-1da89146af3d.jpeg",
      audioUrl: "https://cdn1.suno.ai/754977c5-e4a5-4064-a140-1da89146af3d.mp3",
      duration: "2:39",
      isEarlyAccess: true,
      publicReleaseAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  ]);

  await db.insert(testimonies).values([
    {
      nameDisplay: "Marie J.",
      contentText: "This app has transformed my morning routine. I start each day with the daily verse and devotional, and it fills my heart with peace. Thank you for creating such a beautiful space for worship and reflection.",
      status: "pending",
    },
    {
      nameDisplay: "Jean-Pierre L.",
      contentText: "Mwen tèlman kontan jwenn yon app ki gen konteni nan Kreyòl Ayisyen! Mizik yo ak devosyon chak jou yo ede mwen grandi nan lafwa mwen. Bondye beni tout ekip la.",
      status: "approved",
      isFeatured: true,
    },
  ]);

  await db.insert(prayerRequests).values([
    {
      name: "Sarah M.",
      email: "sarah@example.com",
      message: "Please pray for my mother who is recovering from surgery. We trust in God's healing power.",
      language: "en",
      status: "pending",
    },
    {
      name: "Pierre D.",
      email: "pierre@example.com",
      message: "Tanpri lapriyè pou fanmi mwen. Nou bezwen fòs Bondye nan moman difisil sa a.",
      language: "ht",
      status: "approved",
    },
  ]);

  console.log("[SEED] Seed data inserted successfully");
}

export async function seedGenresAndMoods() {
  const GENRES = [
    { name: "Kompa Gospel", slug: "kompa-gospel", displayOrder: 1 },
    { name: "Afrobeat Gospel", slug: "afrobeat-gospel", displayOrder: 2 },
    { name: "Worship / Adoration", slug: "worship", displayOrder: 3 },
    { name: "Praise / Louange", slug: "praise", displayOrder: 4 },
    { name: "Jazz Gospel", slug: "jazz-gospel", displayOrder: 5 },
    { name: "Acoustic", slug: "acoustic", displayOrder: 6 },
    { name: "Live", slug: "live", displayOrder: 7 },
    { name: "Instrumental", slug: "instrumental", displayOrder: 8 },
  ];

  const MOODS = [
    { name: "Peace / Lapè", slug: "peace", displayOrder: 1 },
    { name: "Joy / Lajwa", slug: "joy", displayOrder: 2 },
    { name: "Prayer / Lapriyè", slug: "prayer", displayOrder: 3 },
    { name: "Breakthrough / Viktwa", slug: "breakthrough", displayOrder: 4 },
    { name: "Healing / Gerizon", slug: "healing", displayOrder: 5 },
  ];

  for (const g of GENRES) {
    await db.insert(genres).values(g).onConflictDoNothing();
  }
  for (const m of MOODS) {
    await db.insert(moods).values(m).onConflictDoNothing();
  }
  console.log("[SEED] Genres and moods seeded");
}
