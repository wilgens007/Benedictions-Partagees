import { db } from "./db";
import { albums, testimonies, prayerRequests, genres, moods } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedAdminData() {
  const existingAlbums = await db.select({ count: sql<number>`count(*)` }).from(albums);
  if (Number(existingAlbums[0].count) > 0) {
    console.log("[SEED] Data already exists, skipping seed");
    return;
  }

  console.log("[SEED] Seeding sample admin data...");

  // Note: songs and albums are managed exclusively via the Admin panel.
  // No sample songs are seeded; the music library starts empty.

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
