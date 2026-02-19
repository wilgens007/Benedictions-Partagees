import { Router } from "express";
import { db } from "./db";
import { prayerRequests, prayerReactions, prayerComments, prayerReports } from "@shared/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { requireUser, optionalUser } from "./userAuth";

const router = Router();

const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
function containsUrl(text: string): boolean {
  return URL_REGEX.test(text);
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, maxPerHour: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  if (entry.count >= maxPerHour) return false;
  entry.count++;
  return true;
}

router.get("/api/prayer-wall/requests", optionalUser, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = parseInt(req.query.offset as string) || 0;
    const userId = (req as any).user?.id;

    const rows = await db.select().from(prayerRequests)
      .where(eq(prayerRequests.status, "approved"))
      .orderBy(desc(prayerRequests.createdAt))
      .limit(limit)
      .offset(offset);

    const commentCounts = await Promise.all(
      rows.map(r =>
        db.select({ cnt: count() }).from(prayerComments)
          .where(and(eq(prayerComments.prayerRequestId, r.id), eq(prayerComments.status, "approved")))
          .then(c => c[0]?.cnt ?? 0)
      )
    );

    let userReactions: Record<string, string[]> = {};
    if (userId && rows.length > 0) {
      const reactions = await db.select().from(prayerReactions)
        .where(eq(prayerReactions.userId, userId));
      for (const r of reactions) {
        if (!userReactions[r.prayerRequestId]) userReactions[r.prayerRequestId] = [];
        userReactions[r.prayerRequestId].push(r.type);
      }
    }

    const result = rows.map((r, i) => ({
      id: r.id,
      displayName: r.displayName,
      message: r.message,
      category: r.category,
      prayedCount: r.prayedCount,
      amenCount: r.amenCount,
      commentCount: commentCounts[i],
      createdAt: r.createdAt,
      userReactions: userReactions[r.id] || [],
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching prayer wall:", error);
    res.status(500).json({ error: "Failed to fetch prayer requests" });
  }
});

router.post("/api/prayer-wall/requests", requireUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!checkRateLimit(`prayer:${user.id}`, 3)) {
      return res.status(429).json({ error: "Too many prayer requests. Please wait before submitting another." });
    }

    const { message, category, displayMode } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "Prayer request message is required" });
    }
    if (message.length > 500) {
      return res.status(400).json({ error: "Prayer request must be under 500 characters" });
    }
    if (containsUrl(message)) {
      return res.status(400).json({ error: "Links are not allowed in prayer requests" });
    }

    const validModes = ["full_name", "first_name", "anonymous"];
    const mode = validModes.includes(displayMode) ? displayMode : "first_name";

    let displayName = "Anonymous";
    if (mode === "full_name") {
      displayName = user.username;
    } else if (mode === "first_name") {
      displayName = user.username.split(" ")[0];
    }

    const [pr] = await db.insert(prayerRequests).values({
      name: user.username,
      email: user.email || "",
      message: message.trim(),
      language: req.body.language || "en",
      userId: user.id,
      displayMode: mode,
      displayName,
      category: category || null,
      status: "pending",
    }).returning();

    res.status(201).json({ id: pr.id, status: "pending" });
  } catch (error) {
    console.error("Error creating prayer request:", error);
    res.status(500).json({ error: "Failed to submit prayer request" });
  }
});

router.post("/api/prayer-wall/requests/:id/react", requireUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { type } = req.body;

    if (!["PRAYED", "AMEN"].includes(type)) {
      return res.status(400).json({ error: "Invalid reaction type" });
    }

    const existing = await db.select().from(prayerReactions).where(
      and(
        eq(prayerReactions.prayerRequestId, id),
        eq(prayerReactions.userId, user.id),
        eq(prayerReactions.type, type)
      )
    );

    if (existing.length > 0) {
      await db.delete(prayerReactions).where(eq(prayerReactions.id, existing[0].id));
      const col = type === "PRAYED" ? prayerRequests.prayedCount : prayerRequests.amenCount;
      await db.update(prayerRequests).set({
        [type === "PRAYED" ? "prayedCount" : "amenCount"]: sql`GREATEST(${col} - 1, 0)`,
      }).where(eq(prayerRequests.id, id));
      res.json({ action: "removed" });
    } else {
      await db.insert(prayerReactions).values({
        prayerRequestId: id,
        userId: user.id,
        type,
      });
      const col = type === "PRAYED" ? prayerRequests.prayedCount : prayerRequests.amenCount;
      await db.update(prayerRequests).set({
        [type === "PRAYED" ? "prayedCount" : "amenCount"]: sql`${col} + 1`,
      }).where(eq(prayerRequests.id, id));
      res.json({ action: "added" });
    }
  } catch (error) {
    console.error("Error toggling reaction:", error);
    res.status(500).json({ error: "Failed to toggle reaction" });
  }
});

router.get("/api/prayer-wall/requests/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db.select().from(prayerComments)
      .where(and(eq(prayerComments.prayerRequestId, id), eq(prayerComments.status, "approved")))
      .orderBy(prayerComments.createdAt);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

router.post("/api/prayer-wall/requests/:id/comments", requireUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { message } = req.body;

    if (!checkRateLimit(`comment:${user.id}`, 10)) {
      return res.status(429).json({ error: "Too many comments. Please wait before posting another." });
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "Comment is required" });
    }
    if (message.length > 220) {
      return res.status(400).json({ error: "Comment must be under 220 characters" });
    }
    if (containsUrl(message)) {
      return res.status(400).json({ error: "Links are not allowed in comments" });
    }

    const [comment] = await db.insert(prayerComments).values({
      prayerRequestId: id,
      userId: user.id,
      displayName: user.username,
      message: message.trim(),
      status: "approved",
    }).returning();

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to post comment" });
  }
});

router.post("/api/prayer-wall/report", requireUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { targetType, targetId, reason } = req.body;

    if (!["REQUEST", "COMMENT"].includes(targetType)) {
      return res.status(400).json({ error: "Invalid target type" });
    }
    if (!targetId) {
      return res.status(400).json({ error: "Target ID required" });
    }

    await db.insert(prayerReports).values({
      targetType,
      targetId,
      reporterUserId: user.id,
      reason: reason || null,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error submitting report:", error);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

export default router;
