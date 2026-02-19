import { Router } from "express";
import { db } from "./db";
import { playlists, playlistSongs } from "@shared/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { requireUser, requirePremium, optionalUser } from "./userAuth";
import { z } from "zod";

const router = Router();

const createPlaylistSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  isPublic: z.boolean().optional(),
});

const updatePlaylistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(300).optional(),
  isPublic: z.boolean().optional(),
});

const addSongSchema = z.object({
  songId: z.string().min(1),
});

router.get("/api/playlists", requireUser, requirePremium, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userPlaylists = await db.select().from(playlists)
      .where(eq(playlists.userId, userId))
      .orderBy(desc(playlists.createdAt));

    const result = await Promise.all(userPlaylists.map(async (pl) => {
      const songs = await db.select().from(playlistSongs)
        .where(eq(playlistSongs.playlistId, pl.id))
        .orderBy(asc(playlistSongs.sortOrder));
      return { ...pl, songCount: songs.length, songIds: songs.map(s => s.songId) };
    }));

    res.json(result);
  } catch (error: any) {
    console.error("Error fetching playlists:", error.message);
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
});

router.post("/api/playlists", requireUser, requirePremium, async (req: any, res) => {
  try {
    const validation = createPlaylistSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid input", details: validation.error.issues });
    }

    const userPlaylists = await db.select().from(playlists)
      .where(eq(playlists.userId, req.user.id));
    if (userPlaylists.length >= 20) {
      return res.status(400).json({ error: "Maximum 20 playlists allowed" });
    }

    const [playlist] = await db.insert(playlists).values({
      userId: req.user.id,
      name: validation.data.name,
      description: validation.data.description || null,
      isPublic: validation.data.isPublic ?? false,
    }).returning();

    res.status(201).json({ ...playlist, songCount: 0, songIds: [] });
  } catch (error: any) {
    console.error("Error creating playlist:", error.message);
    res.status(500).json({ error: "Failed to create playlist" });
  }
});

router.patch("/api/playlists/:id", requireUser, requirePremium, async (req: any, res) => {
  try {
    const validation = updatePlaylistSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const [existing] = await db.select().from(playlists)
      .where(and(eq(playlists.id, req.params.id), eq(playlists.userId, req.user.id)));
    if (!existing) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const updates: any = {};
    if (validation.data.name !== undefined) updates.name = validation.data.name;
    if (validation.data.description !== undefined) updates.description = validation.data.description;
    if (validation.data.isPublic !== undefined) updates.isPublic = validation.data.isPublic;

    const [updated] = await db.update(playlists)
      .set(updates)
      .where(eq(playlists.id, req.params.id))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error("Error updating playlist:", error.message);
    res.status(500).json({ error: "Failed to update playlist" });
  }
});

router.delete("/api/playlists/:id", requireUser, requirePremium, async (req: any, res) => {
  try {
    const [existing] = await db.select().from(playlists)
      .where(and(eq(playlists.id, req.params.id), eq(playlists.userId, req.user.id)));
    if (!existing) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    await db.delete(playlistSongs).where(eq(playlistSongs.playlistId, req.params.id));
    await db.delete(playlists).where(eq(playlists.id, req.params.id));

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting playlist:", error.message);
    res.status(500).json({ error: "Failed to delete playlist" });
  }
});

router.post("/api/playlists/:id/songs", requireUser, requirePremium, async (req: any, res) => {
  try {
    const validation = addSongSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const [existing] = await db.select().from(playlists)
      .where(and(eq(playlists.id, req.params.id), eq(playlists.userId, req.user.id)));
    if (!existing) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const existingSongs = await db.select().from(playlistSongs)
      .where(eq(playlistSongs.playlistId, req.params.id));

    if (existingSongs.length >= 100) {
      return res.status(400).json({ error: "Maximum 100 songs per playlist" });
    }

    const maxOrder = existingSongs.reduce((max, s) => Math.max(max, s.sortOrder), -1);

    const [added] = await db.insert(playlistSongs).values({
      playlistId: req.params.id,
      songId: validation.data.songId,
      sortOrder: maxOrder + 1,
    }).returning();

    res.status(201).json(added);
  } catch (error: any) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Song already in playlist" });
    }
    console.error("Error adding song:", error.message);
    res.status(500).json({ error: "Failed to add song" });
  }
});

router.delete("/api/playlists/:id/songs/:songId", requireUser, requirePremium, async (req: any, res) => {
  try {
    const [existing] = await db.select().from(playlists)
      .where(and(eq(playlists.id, req.params.id), eq(playlists.userId, req.user.id)));
    if (!existing) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    await db.delete(playlistSongs)
      .where(and(
        eq(playlistSongs.playlistId, req.params.id),
        eq(playlistSongs.songId, req.params.songId),
      ));

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error removing song:", error.message);
    res.status(500).json({ error: "Failed to remove song" });
  }
});

router.get("/api/playlists/public/:id", async (req, res) => {
  try {
    const [playlist] = await db.select().from(playlists)
      .where(and(eq(playlists.id, req.params.id), eq(playlists.isPublic, true)));

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found or is private" });
    }

    const songs = await db.select().from(playlistSongs)
      .where(eq(playlistSongs.playlistId, playlist.id))
      .orderBy(asc(playlistSongs.sortOrder));

    res.json({ ...playlist, songIds: songs.map(s => s.songId) });
  } catch (error: any) {
    console.error("Error fetching public playlist:", error.message);
    res.status(500).json({ error: "Failed to fetch playlist" });
  }
});

export default router;
