import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPrayerRequestSchema, prayerRequests, insertDbPrayerRequestSchema, songs as songsTable, testimonies, genres, moods, songGenres, songMoods, songPlays, media } from "@shared/schema";
import type { Language } from "@shared/schema";
import { sendPrayerRequestEmail } from "./resend";
import { generateDailyContent, getTodayKeyET, getDailyContentForDay, postDailyToFacebook } from "./dailyContentGenerator";
import { saveSubscription, removeSubscription, sendPushToAll } from "./pushService";
import { db } from "./db";
import { supportConfig, dailyContent, pushSubscriptions, users } from "@shared/schema";
import { eq, and, desc, asc, ilike, or, sql, gte, count } from "drizzle-orm";
import { dailyVerses } from "./data/dailyVerses";
import { encouragements } from "./data/encouragements";
import { optionalUser } from "./userAuth";
import { getUncachableStripeClient } from "./stripeClient";
import { registerDevotionGenerationRoute } from "./devotionGenerationRoute";
import { registerDevotionRepairRoute, repairDailyContentForDay } from "./devotionRepairRoute";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [row] = await db.select().from(media).where(eq(media.id, id));
      if (!row) return res.status(404).json({ error: "Media not found" });

      const buffer = Buffer.from(row.data, "base64");
      res.set({
        "Content-Type": row.mimeType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      });
      res.send(buffer);
    } catch (error) {
      console.error("Error serving media:", error);
      res.status(500).json({ error: "Failed to serve media" });
    }
  });

  app.get("/api/daily-verse", async (req, res) => {
    try {
      const language = (req.query.language as Language) || "en";
      const verse = await storage.getDailyVerse(language);
      res.json(verse);
    } catch (error) {
      console.error("Error fetching daily verse:", error);
      res.status(500).json({ error: "Failed to fetch daily verse" });
    }
  });

  app.get("/api/encouragement", async (req, res) => {
    try {
      const language = (req.query.language as Language) || "en";
      const encouragement = await storage.getEncouragement(language);
      res.json(encouragement);
    } catch (error) {
      console.error("Error fetching encouragement:", error);
      res.status(500).json({ error: "Failed to fetch encouragement" });
    }
  });

  registerDevotionGenerationRoute(app, {
    getCronSecret: () => process.env.CRON_SECRET,
    getTodayKeyET,
    generateDailyContent,
  });

  app.post("/api/admin/daily-content-reset", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers["x-cron-secret"] as string;

    if (!cronSecret || !providedSecret || providedSecret !== cronSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const result = await db.delete(dailyContent);
      const dayKey = getTodayKeyET();
      const genResult = await generateDailyContent(dayKey);
      res.json({ cleared: true, regenerated: genResult });
    } catch (err: any) {
      console.error("[ADMIN] daily-content-reset error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  registerDevotionRepairRoute(app, {
    getCronSecret: () => process.env.CRON_SECRET,
    getTodayKeyET,
    repairDailyContentForDay,
  });

  app.post("/api/admin/stripe-sync-user", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers["x-cron-secret"] as string;

    if (!cronSecret || !providedSecret || providedSecret !== cronSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { email, force } = req.body;
      if (!email) {
        return res.status(400).json({ error: "email is required" });
      }

      const userRows = await db.select().from(users).where(eq(users.email, email));
      if (userRows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = userRows[0];

      if (user.stripeCustomerId && !force) {
        const { WebhookHandlers } = await import("./webhookHandlers");
        const synced = await WebhookHandlers.syncUserPremiumStatus(user.id);
        return res.json({ synced: true, isPremium: synced, email: user.email, method: "stripe_sync" });
      }

      await db.update(users).set({
        isPremium: true,
        premiumSource: "stripe",
        premiumSince: user.premiumSince || new Date(),
      }).where(eq(users.id, user.id));

      return res.json({ synced: true, isPremium: true, email: user.email, method: "manual_grant" });
    } catch (err: any) {
      console.error("[ADMIN] stripe-sync-user error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/stripe-webhook-status", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers["x-cron-secret"] as string;

    if (!cronSecret || !providedSecret || providedSecret !== cronSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();
      const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
      const domains = process.env.REPLIT_DOMAINS || "";
      const expectedHost = domains.split(",")[0];

      const results = webhooks.data.map((wh: any) => ({
        id: wh.id,
        url: wh.url,
        status: wh.status,
        matchesApp: wh.url?.includes(expectedHost),
        enabledEvents: wh.enabled_events?.length,
      }));

      res.json({ webhooks: results, expectedHost });
    } catch (err: any) {
      console.error("[ADMIN] stripe-webhook-status error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/reset-user-password", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers["x-cron-secret"] as string;

    if (!cronSecret || !providedSecret || providedSecret !== cronSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword) {
        return res.status(400).json({ error: "email and newPassword are required" });
      }

      const bcryptModule = await import("bcryptjs");
      const bcryptLib = bcryptModule.default || bcryptModule;
      const userRows = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase()));
      if (userRows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const passwordHash = await bcryptLib.hash(newPassword, 10);
      await db.update(users).set({ password: passwordHash }).where(eq(users.id, userRows[0].id));

      res.json({ success: true, email: userRows[0].email });
    } catch (err: any) {
      console.error("[ADMIN] reset-user-password error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/email-test", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers["x-cron-secret"] as string;

    if (!cronSecret || !providedSecret || providedSecret !== cronSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { to } = req.body;
      if (!to) {
        return res.status(400).json({ error: "to (email address) is required" });
      }

      const { sendTestEmail } = await import("./resend");
      const response = await sendTestEmail(to);
      res.json(response);
    } catch (err: any) {
      console.error("[ADMIN] email-test error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/daily-content-debug", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers["x-cron-secret"] as string;

    if (!cronSecret || !providedSecret || providedSecret !== cronSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const dayKey = (req.query.dayKey as string) || getTodayKeyET();
    const languages: Language[] = ["en", "fr", "ht"];

    const rows = await db
      .select()
      .from(dailyContent)
      .where(eq(dailyContent.dayKey, dayKey));

    const [year, month, day] = dayKey.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const start = new Date(year, 0, 0);
    const dayIndex = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const result = {
      dayKey,
      dayIndex,
      versePoolSizes: {
        en: dailyVerses.en.length,
        fr: dailyVerses.fr.length,
        ht: dailyVerses.ht.length,
      },
      encouragementPoolSizes: {
        en: encouragements.en.length,
        fr: encouragements.fr.length,
        ht: encouragements.ht.length,
      },
      expectedVerseIndices: {
        en: dayIndex % dailyVerses.en.length,
        fr: dayIndex % dailyVerses.fr.length,
        ht: dayIndex % dailyVerses.ht.length,
      },
      records: languages.map((lang) => {
        const row = rows.find((r) => r.language === lang);
        return {
          language: lang,
          exists: !!row,
          verseRef: row?.reference || null,
          createdAt: row?.createdAt || null,
          encouragementAuthor: row?.encouragementAuthor || null,
        };
      }),
    };

    res.json(result);
  });

  app.get("/api/push/vapid-public-key", (_req, res) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(500).json({ error: "VAPID public key not configured" });
    }
    res.json({ publicKey });
  });

  app.post("/api/push/check", async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ exists: false });
      }
      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint));
      res.json({ exists: existing.length > 0 });
    } catch (error: any) {
      console.error("[PUSH] Error checking subscription:", error.message || error);
      res.json({ exists: false });
    }
  });

  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const { subscription, language } = req.body;
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: "Invalid subscription object" });
      }
      const result = await saveSubscription({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        language: language || "en",
      });
      res.json(result);
    } catch (error: any) {
      console.error("[PUSH] Error saving subscription:", error.message || error);
      res.status(500).json({ error: "Failed to save subscription" });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ error: "Missing endpoint" });
      }
      const result = await removeSubscription(endpoint);
      res.json(result);
    } catch (error: any) {
      console.error("[PUSH] Error removing subscription:", error.message || error);
      res.status(500).json({ error: "Failed to remove subscription" });
    }
  });

  app.post("/api/push/send-today", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers["x-cron-secret"] as string;

    if (!cronSecret || !providedSecret || providedSecret !== cronSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const result = await sendPushToAll({
        title: "BP \u2014 Devotion du jour",
        body: "Le verset et la m\u00e9ditation d'aujourd'hui sont pr\u00eats. Touchez pour lire.",
        url: "/devotion",
      });
      res.json(result);
    } catch (error: any) {
      console.error("[PUSH] Error sending notifications:", error.message || error);
      res.status(500).json({ error: "Failed to send notifications" });
    }
  });

  app.get("/api/share/today", async (req, res) => {
    try {
      const language = (req.query.language as Language) || "en";
      const dayKey = getTodayKeyET();
      const content = await getDailyContentForDay(dayKey, language);
      
      if (!content) {
        return res.status(404).json({ error: "Today's content not yet generated" });
      }

      const excerpt = content.verse.length > 120 ? content.verse.substring(0, 117) + "..." : content.verse;
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host || "benedictionspartagees.org";
      const devotionUrl = `${protocol}://${host}/devotion`;
      const whatsappMessage = `BP \u2014 Devotion du jour (${dayKey})\n${content.reference} \u2014 "${excerpt}"\n\n${devotionUrl}`;
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(devotionUrl)}`;

      res.json({
        dayKey,
        reference: content.reference,
        verseExcerpt: excerpt,
        shareCaption: whatsappMessage,
        whatsappUrl: `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`,
        facebookUrl,
        devotionUrl,
      });
    } catch (error: any) {
      console.error("Error getting share data:", error.message || error);
      res.status(500).json({ error: "Failed to get share data" });
    }
  });

  app.post("/api/social/facebook/post-today", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers["x-cron-secret"] as string;

    if (!cronSecret || !providedSecret || providedSecret !== cronSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const result = await postDailyToFacebook();
      if (result.status === "error") {
        return res.status(500).json(result);
      }
      res.json(result);
    } catch (error: any) {
      console.error("[FACEBOOK] ERROR posting:", error.message || error);
      res.status(500).json({ error: "Failed to post to Facebook" });
    }
  });

  app.get("/api/support/config", async (_req, res) => {
    try {
      const configs = await db.select().from(supportConfig);
      const configMap: Record<string, string> = {};
      for (const c of configs) {
        configMap[c.key] = c.value;
      }
      res.json(configMap);
    } catch (error: any) {
      console.error("Error fetching support config:", error);
      res.json({});
    }
  });

  app.post("/api/support/create-donation-session", async (req, res) => {
    try {
      const { amount, customAmount } = req.body;
      const donationAmount = customAmount ? Math.round(parseFloat(customAmount) * 100) : amount ? amount * 100 : null;

      if (!donationAmount || donationAmount < 100) {
        return res.status(400).json({ error: "Minimum donation is $1.00" });
      }
      if (donationAmount > 999999) {
        return res.status(400).json({ error: "Maximum donation is $9,999.99" });
      }

      const stripe = await getUncachableStripeClient();
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: {
              name: "Donation to Bénédictions Partagées",
              description: "Thank you for supporting our ministry",
            },
            unit_amount: donationAmount,
          },
          quantity: 1,
        }],
        mode: "payment",
        success_url: `${baseUrl}/support/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/support`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating donation session:", error.message);
      res.status(500).json({ error: "Failed to create donation session" });
    }
  });

  app.get("/api/genres", async (_req, res) => {
    try {
      const rows = await db.select().from(genres).orderBy(asc(genres.displayOrder), asc(genres.name));
      res.json(rows);
    } catch (error) {
      console.error("Error fetching genres:", error);
      res.status(500).json({ error: "Failed to fetch genres" });
    }
  });

  app.get("/api/moods", async (_req, res) => {
    try {
      const rows = await db.select().from(moods).orderBy(asc(moods.displayOrder), asc(moods.name));
      res.json(rows);
    } catch (error) {
      console.error("Error fetching moods:", error);
      res.status(500).json({ error: "Failed to fetch moods" });
    }
  });

  app.post("/api/songs/play", optionalUser, async (req: any, res) => {
    try {
      const { songId } = req.body;
      if (!songId) return res.status(400).json({ error: "songId required" });

      const isInMemorySong = /^\d+$/.test(songId);
      if (!isInMemorySong) {
        await db.update(songsTable).set({ playsCount: sql`${songsTable.playsCount} + 1` }).where(eq(songsTable.id, songId));
        await db.insert(songPlays).values({ songId, userId: req.user?.id || null });
      }

      res.json({ ok: true });
    } catch (error) {
      console.error("Error logging play:", error);
      res.status(500).json({ error: "Failed to log play" });
    }
  });

  app.get("/api/music", optionalUser, async (req: any, res) => {
    try {
      const user = req.user;
      const isPremium = user?.isPremium || false;
      const genreSlug = (req.query.genre as string || "").trim();
      const moodSlug = (req.query.mood as string || "").trim();
      const q = (req.query.q as string || "").trim();
      const sort = (req.query.sort as string || "new").trim();
      const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 100);

      const hasFilters = genreSlug || moodSlug || q;

      let dbSongs: any[];

      if (genreSlug) {
        const whereConditions = [eq(genres.slug, genreSlug)];
        if (q) {
          whereConditions.push(or(ilike(songsTable.title, `%${q}%`), ilike(songsTable.artist, `%${q}%`)) as any);
        }
        let query = db
          .select({
            id: songsTable.id, title: songsTable.title, artist: songsTable.artist,
            coverUrl: songsTable.coverUrl, audioUrl: songsTable.audioUrl, duration: songsTable.duration,
            isEarlyAccess: songsTable.isEarlyAccess, releaseDate: songsTable.releaseDate,
            playsCount: songsTable.playsCount, createdAt: songsTable.createdAt,
            isFeatured: songsTable.isFeatured, featuredRank: songsTable.featuredRank,
          })
          .from(songsTable)
          .innerJoin(songGenres, eq(songGenres.songId, songsTable.id))
          .innerJoin(genres, eq(genres.id, songGenres.genreId))
          .where(and(...whereConditions));

        if (sort === "popular") dbSongs = await query.orderBy(desc(songsTable.playsCount), desc(songsTable.releaseDate)).limit(limit);
        else if (sort === "az") dbSongs = await query.orderBy(asc(songsTable.title)).limit(limit);
        else dbSongs = await query.orderBy(desc(songsTable.releaseDate)).limit(limit);
      } else if (moodSlug) {
        const whereConditions = [eq(moods.slug, moodSlug)];
        if (q) {
          whereConditions.push(or(ilike(songsTable.title, `%${q}%`), ilike(songsTable.artist, `%${q}%`)) as any);
        }
        let query = db
          .select({
            id: songsTable.id, title: songsTable.title, artist: songsTable.artist,
            coverUrl: songsTable.coverUrl, audioUrl: songsTable.audioUrl, duration: songsTable.duration,
            isEarlyAccess: songsTable.isEarlyAccess, releaseDate: songsTable.releaseDate,
            playsCount: songsTable.playsCount, createdAt: songsTable.createdAt,
            isFeatured: songsTable.isFeatured, featuredRank: songsTable.featuredRank,
          })
          .from(songsTable)
          .innerJoin(songMoods, eq(songMoods.songId, songsTable.id))
          .innerJoin(moods, eq(moods.id, songMoods.moodId))
          .where(and(...whereConditions));

        if (sort === "popular") dbSongs = await query.orderBy(desc(songsTable.playsCount), desc(songsTable.releaseDate)).limit(limit);
        else if (sort === "az") dbSongs = await query.orderBy(asc(songsTable.title)).limit(limit);
        else dbSongs = await query.orderBy(desc(songsTable.releaseDate)).limit(limit);
      } else {
        const whereConditions: any[] = [];
        if (q) {
          whereConditions.push(or(ilike(songsTable.title, `%${q}%`), ilike(songsTable.artist, `%${q}%`)));
        }
        let query = db.select().from(songsTable);
        if (whereConditions.length) query = query.where(and(...whereConditions)) as any;

        if (sort === "popular") dbSongs = await query.orderBy(desc(songsTable.playsCount), desc(songsTable.releaseDate)).limit(limit);
        else if (sort === "az") dbSongs = await query.orderBy(asc(songsTable.title)).limit(limit);
        else dbSongs = await query.orderBy(desc(songsTable.releaseDate)).limit(limit);
      }

      const dbTracks = dbSongs.map((s: any) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        duration: s.duration || "",
        audioUrl: s.audioUrl,
        albumArt: s.coverUrl || "",
        isEarlyAccess: s.isEarlyAccess || false,
        releaseDate: s.releaseDate ? (s.releaseDate instanceof Date ? s.releaseDate.toISOString() : s.releaseDate) : s.createdAt ? (s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt) : null,
        playsCount: s.playsCount || 0,
        isFeatured: s.isFeatured || false,
      }));

      const inMemoryTracks = await storage.getMusicTracks();
      const allTracks = hasFilters ? dbTracks : [...dbTracks, ...inMemoryTracks];

      const filteredTracks = allTracks.map((track: any) => {
        if (track.isEarlyAccess && !isPremium) {
          return { ...track, audioUrl: null, locked: true, lockReason: "early_access" };
        }
        return { ...track, locked: false };
      });

      res.json(filteredTracks);
    } catch (error) {
      console.error("Error fetching music tracks:", error);
      res.status(500).json({ error: "Failed to fetch music tracks" });
    }
  });

  app.get("/api/music/featured", optionalUser, async (req: any, res) => {
    try {
      const user = req.user;
      const isPremium = user?.isPremium || false;
      const listMode = req.query.list === "true";

      const featuredSongs = await db.select().from(songsTable)
        .where(eq(songsTable.isFeatured, true))
        .orderBy(asc(songsTable.featuredRank), desc(songsTable.releaseDate))
        .limit(12);

      if (featuredSongs.length === 0) {
        const [latestSong] = await db.select().from(songsTable).orderBy(desc(songsTable.releaseDate)).limit(1);
        if (!latestSong) return res.json(listMode ? [] : null);
        featuredSongs.push(latestSong);
      }

      const toTrack = (s: any) => {
        const track: any = {
          id: s.id, title: s.title, artist: s.artist,
          duration: s.duration || "", audioUrl: s.audioUrl,
          albumArt: s.coverUrl || "",
          isEarlyAccess: s.isEarlyAccess || false,
          releaseDate: s.releaseDate ? s.releaseDate.toISOString() : s.createdAt ? s.createdAt.toISOString() : null,
          playsCount: s.playsCount || 0, isFeatured: true, locked: false,
        };
        if (track.isEarlyAccess && !isPremium) {
          track.audioUrl = null; track.locked = true; track.lockReason = "early_access";
        }
        return track;
      };

      if (listMode) {
        res.json(featuredSongs.map(toTrack));
      } else {
        res.json(toTrack(featuredSongs[0]));
      }
    } catch (error) {
      console.error("Error fetching featured songs:", error);
      res.status(500).json({ error: "Failed to fetch featured songs" });
    }
  });

  app.get("/api/music/trending", optionalUser, async (req: any, res) => {
    try {
      const user = req.user;
      const isPremium = user?.isPremium || false;
      const days = Math.min(parseInt(req.query.days as string || "7", 10), 30);
      const limit = Math.min(parseInt(req.query.limit as string || "12", 10), 50);
      const cutoff = new Date(Date.now() - days * 86400 * 1000);

      const rows = await db
        .select({
          id: songsTable.id, title: songsTable.title, artist: songsTable.artist,
          coverUrl: songsTable.coverUrl, audioUrl: songsTable.audioUrl, duration: songsTable.duration,
          isEarlyAccess: songsTable.isEarlyAccess, releaseDate: songsTable.releaseDate,
          playsCount: songsTable.playsCount, createdAt: songsTable.createdAt,
          trendingPlays: count(songPlays.id),
        })
        .from(songPlays)
        .innerJoin(songsTable, eq(songsTable.id, songPlays.songId))
        .where(gte(songPlays.playedAt, cutoff))
        .groupBy(songsTable.id, songsTable.title, songsTable.artist, songsTable.coverUrl, songsTable.audioUrl, songsTable.duration, songsTable.isEarlyAccess, songsTable.releaseDate, songsTable.playsCount, songsTable.createdAt)
        .orderBy(desc(count(songPlays.id)))
        .limit(limit);

      const tracks = rows.map((s: any) => {
        const track: any = {
          id: s.id, title: s.title, artist: s.artist,
          duration: s.duration || "", audioUrl: s.audioUrl,
          albumArt: s.coverUrl || "",
          isEarlyAccess: s.isEarlyAccess || false,
          releaseDate: s.releaseDate ? s.releaseDate.toISOString() : s.createdAt ? s.createdAt.toISOString() : null,
          playsCount: s.playsCount || 0, trendingPlays: Number(s.trendingPlays), locked: false,
        };
        if (track.isEarlyAccess && !isPremium) {
          track.audioUrl = null; track.locked = true; track.lockReason = "early_access";
        }
        return track;
      });

      res.json(tracks);
    } catch (error) {
      console.error("Error fetching trending songs:", error);
      res.status(500).json({ error: "Failed to fetch trending songs" });
    }
  });

  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.post("/api/prayer-requests", async (req, res) => {
    try {
      const validation = insertDbPrayerRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: validation.error.issues 
        });
      }

      const [prayerRequest] = await db.insert(prayerRequests).values(validation.data).returning();
      
      try {
        console.log(`[DEBUG] Attempting to send prayer request email to benedictionspartagees@gmail.com for ${validation.data.name}...`);
        const emailResult = await sendPrayerRequestEmail(
          validation.data.name,
          validation.data.email,
          validation.data.message
        );
        console.log("[DEBUG] Prayer request email result:", JSON.stringify(emailResult));
        
        if (emailResult.error) {
          console.error("[DEBUG] Resend API returned an error:", emailResult.error);
        }
      } catch (emailError: any) {
        console.error("[DEBUG] CRITICAL: Error in sendPrayerRequestEmail:", emailError.message || emailError);
      }
      
      res.status(201).json(prayerRequest);
    } catch (error) {
      console.error("Error creating prayer request:", error);
      res.status(500).json({ error: "Failed to submit prayer request" });
    }
  });

  app.get("/api/prayer-requests", async (req, res) => {
    try {
      const rows = await db.select().from(prayerRequests).where(eq(prayerRequests.status, "approved")).orderBy(desc(prayerRequests.createdAt));
      res.json(rows);
    } catch (error) {
      console.error("Error fetching prayer requests:", error);
      res.status(500).json({ error: "Failed to fetch prayer requests" });
    }
  });

  app.get("/api/testimonies", async (_req, res) => {
    try {
      const rows = await db.select().from(testimonies).where(eq(testimonies.status, "approved")).orderBy(desc(testimonies.createdAt));
      res.json(rows);
    } catch (error) {
      console.error("Error fetching testimonies:", error);
      res.status(500).json({ error: "Failed to fetch testimonies" });
    }
  });

  return httpServer;
}
