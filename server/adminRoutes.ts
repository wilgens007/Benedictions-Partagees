import { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "./db";
import {
  albums, songs, testimonies, prayerRequests, prayerComments, prayerReports, users, adminSessions,
  genres, moods, songGenres, songMoods, announcements, media,
  insertAlbumSchema, insertSongSchema, insertTestimonySchema, insertAnnouncementSchema,
  type Album, type Song, type Testimony, type DbPrayerRequest,
} from "@shared/schema";
import { sendPushToAll, sendNotificationByType } from "./pushService";
import { eq, desc, ilike, sql, and, inArray } from "drizzle-orm";
import { requireAdmin, isAdminEmail, createAdminSession, validateAdminToken } from "./adminAuth";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const memStorage = multer.memoryStorage();

async function resolveSunoAudioUrl(url: string): Promise<string> {
  if (!url) return url;
  if (url.includes("cdn1.suno.ai") && url.endsWith(".mp3")) return url;

  const sunoShareMatch = url.match(/suno\.com\/s\/([A-Za-z0-9_-]+)/);
  const sunoSongMatch = url.match(/suno\.com\/song\/([0-9a-f-]{36})/);

  if (sunoSongMatch) {
    return `https://suno.com/song/${sunoSongMatch[1]}`;
  }

  if (sunoShareMatch) {
    try {
      const resp = await fetch(url, { method: "HEAD", redirect: "follow" });
      const finalUrl = resp.url;
      const uuidMatch = finalUrl.match(/song\/([0-9a-f-]{36})/);
      if (uuidMatch) {
        return `https://suno.com/song/${uuidMatch[1]}`;
      }
    } catch (err) {
      console.log(`[SUNO] Failed to resolve share URL: ${url}`, err);
    }
  }

  return url;
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage: memStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const uploadDisk = multer({
  storage: diskStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

export function registerAdminRoutes(app: Express) {
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    const { email, secret } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      return res.status(500).json({ error: "Admin login not configured" });
    }
    if (!secret || secret !== adminSecret) {
      return res.status(403).json({ error: "Invalid credentials" });
    }
    if (!isAdminEmail(email)) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const token = await createAdminSession(email);
    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });
    res.json({ success: true, token });
  });

  app.post("/api/admin/logout", requireAdmin, async (req: Request, res: Response) => {
    const token = req.headers["x-admin-token"] as string || req.cookies?.admin_token;
    if (token) {
      await db.delete(adminSessions).where(eq(adminSessions.token, token));
    }
    res.clearCookie("admin_token");
    res.json({ success: true });
  });

  app.get("/api/admin/me", requireAdmin, async (req: Request, res: Response) => {
    res.json({ email: (req as any).adminEmail });
  });

  app.post("/api/admin/upload/cover", requireAdmin, upload.single("file"), async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    try {
      const base64 = req.file.buffer.toString("base64");
      const [row] = await db.insert(media).values({
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        data: base64,
      }).returning();
      res.json({ url: `/api/media/${row.id}` });
    } catch (err: any) {
      console.error("[UPLOAD] Cover upload failed:", err.message);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  app.post("/api/admin/upload/audio", requireAdmin, uploadDisk.single("file"), (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  app.get("/api/admin/albums", requireAdmin, async (_req: Request, res: Response) => {
    const rows = await db.select().from(albums).orderBy(desc(albums.createdAt));
    res.json(rows);
  });

  app.post("/api/admin/albums", requireAdmin, async (req: Request, res: Response) => {
    const parsed = insertAlbumSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    const [row] = await db.insert(albums).values(parsed.data).returning();
    res.status(201).json(row);
  });

  app.put("/api/admin/albums/:id", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, artist, coverUrl } = req.body;
    const [row] = await db.update(albums).set({ title, artist, coverUrl }).where(eq(albums.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Album not found" });
    res.json(row);
  });

  app.delete("/api/admin/albums/:id", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const linkedSongs = await db.select().from(songs).where(eq(songs.albumId, id));
    if (linkedSongs.length > 0) {
      return res.status(400).json({ error: `Cannot delete album with ${linkedSongs.length} linked songs. Remove songs first.` });
    }
    await db.delete(albums).where(eq(albums.id, id));
    res.json({ success: true });
  });

  app.get("/api/admin/songs", requireAdmin, async (_req: Request, res: Response) => {
    const rows = await db.select().from(songs).orderBy(desc(songs.createdAt));
    const allSongGenres = await db.select().from(songGenres);
    const allSongMoods = await db.select().from(songMoods);
    const enriched = rows.map((s) => ({
      ...s,
      genreIds: allSongGenres.filter((sg) => sg.songId === s.id).map((sg) => sg.genreId),
      moodIds: allSongMoods.filter((sm) => sm.songId === s.id).map((sm) => sm.moodId),
    }));
    res.json(enriched);
  });

  app.post("/api/admin/songs", requireAdmin, async (req: Request, res: Response) => {
    const body = { ...req.body };
    const genreIds: string[] = body.genreIds || [];
    const moodIds: string[] = body.moodIds || [];
    delete body.genreIds;
    delete body.moodIds;
    if (body.publicReleaseAt) body.publicReleaseAt = new Date(body.publicReleaseAt);
    if (body.releaseDate) body.releaseDate = new Date(body.releaseDate);
    if (body.audioUrl) body.audioUrl = await resolveSunoAudioUrl(body.audioUrl);
    const parsed = insertSongSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    const [row] = await db.insert(songs).values(parsed.data).returning();
    if (genreIds.length > 0) {
      await db.insert(songGenres).values(genreIds.map((gId) => ({ songId: row.id, genreId: gId })));
    }
    if (moodIds.length > 0) {
      await db.insert(songMoods).values(moodIds.map((mId) => ({ songId: row.id, moodId: mId })));
    }
    sendNotificationByType("new_song", {
      songTitle: row.title,
      artist: row.artist,
      url: "/music",
    }).catch((err) => console.error("[PUSH] Auto-notify new song failed:", err));

    res.status(201).json({ ...row, genreIds, moodIds });
  });

  app.put("/api/admin/songs/:id", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates: any = { ...req.body, updatedAt: new Date() };
    const genreIds: string[] | undefined = updates.genreIds;
    const moodIds: string[] | undefined = updates.moodIds;
    delete updates.genreIds;
    delete updates.moodIds;
    if (updates.publicReleaseAt) updates.publicReleaseAt = new Date(updates.publicReleaseAt);
    if (updates.publicReleaseAt === null) updates.publicReleaseAt = null;
    if (updates.releaseDate) updates.releaseDate = new Date(updates.releaseDate);
    if (updates.releaseDate === null) updates.releaseDate = null;
    if (updates.audioUrl) updates.audioUrl = await resolveSunoAudioUrl(updates.audioUrl);
    delete updates.id;
    delete updates.createdAt;
    const [row] = await db.update(songs).set(updates).where(eq(songs.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Song not found" });
    if (genreIds !== undefined) {
      await db.delete(songGenres).where(eq(songGenres.songId, id));
      if (genreIds.length > 0) {
        await db.insert(songGenres).values(genreIds.map((gId) => ({ songId: id, genreId: gId })));
      }
    }
    if (moodIds !== undefined) {
      await db.delete(songMoods).where(eq(songMoods.songId, id));
      if (moodIds.length > 0) {
        await db.insert(songMoods).values(moodIds.map((mId) => ({ songId: id, moodId: mId })));
      }
    }
    res.json({ ...row, genreIds: genreIds || [], moodIds: moodIds || [] });
  });

  app.delete("/api/admin/songs/:id", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    await db.delete(songGenres).where(eq(songGenres.songId, id));
    await db.delete(songMoods).where(eq(songMoods.songId, id));
    await db.delete(songs).where(eq(songs.id, id));
    res.json({ success: true });
  });

  app.get("/api/admin/testimonies", requireAdmin, async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    let rows;
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      rows = await db.select().from(testimonies).where(eq(testimonies.status, status)).orderBy(desc(testimonies.createdAt));
    } else {
      rows = await db.select().from(testimonies).orderBy(desc(testimonies.createdAt));
    }
    res.json(rows);
  });

  app.post("/api/admin/testimonies", requireAdmin, async (req: Request, res: Response) => {
    const parsed = insertTestimonySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    const [row] = await db.insert(testimonies).values(parsed.data).returning();
    res.status(201).json(row);
  });

  app.put("/api/admin/testimonies/:id/status", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const updates: any = { status };
    if (status !== "approved") {
      updates.isFeatured = false;
    }
    const [row] = await db.update(testimonies).set(updates).where(eq(testimonies.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Testimony not found" });
    res.json(row);
  });

  app.put("/api/admin/testimonies/:id/feature", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    await db.update(testimonies).set({ isFeatured: false }).where(eq(testimonies.isFeatured, true));
    const [row] = await db.update(testimonies).set({ isFeatured: true, status: "approved" }).where(eq(testimonies.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Testimony not found" });
    res.json(row);
  });

  app.delete("/api/admin/testimonies/:id", requireAdmin, async (req: Request, res: Response) => {
    await db.delete(testimonies).where(eq(testimonies.id, req.params.id));
    res.json({ success: true });
  });

  app.get("/api/admin/prayer-requests", requireAdmin, async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    let rows;
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      rows = await db.select().from(prayerRequests).where(eq(prayerRequests.status, status)).orderBy(desc(prayerRequests.createdAt));
    } else {
      rows = await db.select().from(prayerRequests).orderBy(desc(prayerRequests.createdAt));
    }
    res.json(rows);
  });

  app.put("/api/admin/prayer-requests/:id/status", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const [row] = await db.update(prayerRequests).set({ status }).where(eq(prayerRequests.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Prayer request not found" });
    res.json(row);
  });

  app.delete("/api/admin/prayer-requests/:id", requireAdmin, async (req: Request, res: Response) => {
    await db.delete(prayerRequests).where(eq(prayerRequests.id, req.params.id));
    res.json({ success: true });
  });

  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;
    const page = parseInt(req.query.page as string || "1", 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    let rows;
    let countResult;

    if (search) {
      rows = await db.select().from(users).where(ilike(users.username, `%${search}%`)).orderBy(users.username).limit(limit).offset(offset);
      countResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(ilike(users.username, `%${search}%`));
    } else {
      rows = await db.select().from(users).orderBy(users.username).limit(limit).offset(offset);
      countResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    }

    res.json({
      users: rows.map((u) => ({ id: u.id, username: u.username })),
      total: Number(countResult[0]?.count || 0),
      page,
      totalPages: Math.ceil(Number(countResult[0]?.count || 0) / limit),
    });
  });

  app.put("/api/admin/users/:id/premium", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isPremium } = req.body;
    const [updated] = await db.update(users).set({
      isPremium: !!isPremium,
      premiumSince: isPremium ? new Date() : null,
    }).where(eq(users.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json({ id: updated.id, username: updated.username, isPremium: updated.isPremium });
  });

  app.get("/api/admin/stats", requireAdmin, async (_req: Request, res: Response) => {
    const [songCount] = await db.select({ count: sql<number>`count(*)` }).from(songs);
    const [albumCount] = await db.select({ count: sql<number>`count(*)` }).from(albums);
    const [testimonyCount] = await db.select({ count: sql<number>`count(*)` }).from(testimonies);
    const [pendingTestimonies] = await db.select({ count: sql<number>`count(*)` }).from(testimonies).where(eq(testimonies.status, "pending"));
    const [prayerCount] = await db.select({ count: sql<number>`count(*)` }).from(prayerRequests);
    const [pendingPrayers] = await db.select({ count: sql<number>`count(*)` }).from(prayerRequests).where(eq(prayerRequests.status, "pending"));
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);

    res.json({
      songs: Number(songCount.count),
      albums: Number(albumCount.count),
      testimonies: Number(testimonyCount.count),
      pendingTestimonies: Number(pendingTestimonies.count),
      prayerRequests: Number(prayerCount.count),
      pendingPrayers: Number(pendingPrayers.count),
      users: Number(userCount.count),
    });
  });

  app.get("/api/admin/prayer-comments", requireAdmin, async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    let rows;
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      rows = await db.select().from(prayerComments).where(eq(prayerComments.status, status)).orderBy(desc(prayerComments.createdAt));
    } else {
      rows = await db.select().from(prayerComments).orderBy(desc(prayerComments.createdAt));
    }
    res.json(rows);
  });

  app.put("/api/admin/prayer-comments/:id/status", requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const [row] = await db.update(prayerComments).set({ status }).where(eq(prayerComments.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Comment not found" });
    res.json(row);
  });

  app.delete("/api/admin/prayer-comments/:id", requireAdmin, async (req: Request, res: Response) => {
    await db.delete(prayerComments).where(eq(prayerComments.id, req.params.id));
    res.json({ success: true });
  });

  app.get("/api/admin/prayer-reports", requireAdmin, async (_req: Request, res: Response) => {
    const rows = await db.select().from(prayerReports).orderBy(desc(prayerReports.createdAt));
    res.json(rows);
  });

  app.delete("/api/admin/prayer-reports/:id", requireAdmin, async (req: Request, res: Response) => {
    await db.delete(prayerReports).where(eq(prayerReports.id, req.params.id));
    res.json({ success: true });
  });

  app.post("/api/admin/notifications/send", requireAdmin, async (req: Request, res: Response) => {
    const parsed = insertAnnouncementSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    const [announcement] = await db.insert(announcements).values(parsed.data).returning();

    const result = await sendNotificationByType(announcement.type, {
      title: announcement.title,
      body: announcement.body,
      url: announcement.url || "/",
    });

    res.json({ success: true, announcement, pushResult: result });
  });

  app.get("/api/admin/notifications", requireAdmin, async (_req: Request, res: Response) => {
    const rows = await db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(50);
    res.json(rows);
  });

  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadsDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });
}
