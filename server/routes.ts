import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPrayerRequestSchema, prayerRequests, insertDbPrayerRequestSchema, songs as songsTable } from "@shared/schema";
import type { Language } from "@shared/schema";
import { sendPrayerRequestEmail } from "./resend";
import { generateDailyContent, getTodayKeyET, getDailyContentForDay } from "./dailyContentGenerator";
import { saveSubscription, removeSubscription, sendPushToAll } from "./pushService";
import { db } from "./db";
import { supportConfig, dailyContent, pushSubscriptions } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { dailyVerses } from "./data/dailyVerses";
import { encouragements } from "./data/encouragements";
import { optionalUser } from "./userAuth";
import { getUncachableStripeClient } from "./stripeClient";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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

  app.post("/api/devotion/generate", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers["x-cron-secret"] as string;

    console.log(`[CRON-ENDPOINT] POST /api/devotion/generate called at ${new Date().toISOString()}`);

    if (!cronSecret) {
      console.error("[CRON-ENDPOINT] ERROR: CRON_SECRET env var is not set on the server");
      return res.status(500).json({ error: "Server misconfiguration: CRON_SECRET not set" });
    }

    if (!providedSecret || providedSecret !== cronSecret) {
      console.warn("[CRON-ENDPOINT] UNAUTHORIZED: Invalid or missing X-CRON-SECRET header");
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const dayKey = getTodayKeyET();
      console.log(`[CRON-ENDPOINT] Computed dayKey=${dayKey} (America/New_York)`);

      const result = await generateDailyContent(dayKey);

      console.log(`[CRON-ENDPOINT] Result: status=${result.status}, dayKey=${result.dayKey}, languages=${result.languages.join(",") || "none"}`);
      res.json(result);
    } catch (error: any) {
      console.error("[CRON-ENDPOINT] ERROR during generation:", error.message || error);
      res.status(500).json({ error: "Generation failed", details: error.message });
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
      const whatsappMessage = `BP \u2014 Devotion du jour (${dayKey})\n${content.reference} \u2014 "${excerpt}"\nLire: https://benedictionspartagees.org/devotion`;
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://benedictionspartagees.org/devotion")}`;

      res.json({
        dayKey,
        reference: content.reference,
        verseExcerpt: excerpt,
        shareCaption: content.shareCaption || whatsappMessage,
        whatsappUrl: `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`,
        facebookUrl,
        devotionUrl: "https://benedictionspartagees.org/devotion",
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

    const pageId = process.env.FACEBOOK_PAGE_ID;
    const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !pageToken) {
      console.log("[FACEBOOK] Auto-post disabled: FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN not set");
      return res.json({ status: "disabled", message: "Facebook auto-post not configured" });
    }

    try {
      const dayKey = getTodayKeyET();
      const content = await getDailyContentForDay(dayKey, "en");

      if (!content) {
        return res.status(404).json({ error: "Today's content not generated yet" });
      }

      const message = content.shareCaption || `BP \u2014 Devotion du jour (${dayKey})\n${content.reference}\nLire: https://benedictionspartagees.org/devotion`;

      const fbResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/feed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            link: "https://benedictionspartagees.org/devotion",
            access_token: pageToken,
          }),
        }
      );

      const fbData = await fbResponse.json();
      console.log(`[FACEBOOK] Post result: status=${fbResponse.status}, response=${JSON.stringify(fbData)}`);

      if (!fbResponse.ok) {
        return res.status(fbResponse.status).json({ error: "Facebook API error", details: fbData });
      }

      res.json({ status: "posted", postId: fbData.id });
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

  app.get("/api/music", optionalUser, async (req: any, res) => {
    try {
      const inMemoryTracks = await storage.getMusicTracks();
      const user = req.user;
      const isPremium = user?.isPremium || false;

      const dbSongs = await db.select().from(songsTable).orderBy(desc(songsTable.releaseDate));
      const dbTracks = dbSongs.map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        duration: s.duration || "",
        audioUrl: s.audioUrl,
        albumArt: s.coverUrl || "",
        isEarlyAccess: s.isEarlyAccess || false,
        releaseDate: s.releaseDate ? s.releaseDate.toISOString() : s.createdAt ? s.createdAt.toISOString() : null,
      }));

      const allTracks = [...dbTracks, ...inMemoryTracks];

      const filteredTracks = allTracks.map((track: any) => {
        if (track.isEarlyAccess && !isPremium) {
          return {
            ...track,
            audioUrl: null,
            locked: true,
            lockReason: "early_access",
          };
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

      const [latestSong] = await db.select().from(songsTable).orderBy(desc(songsTable.releaseDate)).limit(1);

      if (!latestSong) {
        return res.json(null);
      }

      const track: any = {
        id: latestSong.id,
        title: latestSong.title,
        artist: latestSong.artist,
        duration: latestSong.duration || "",
        audioUrl: latestSong.audioUrl,
        albumArt: latestSong.coverUrl || "",
        isEarlyAccess: latestSong.isEarlyAccess || false,
        releaseDate: latestSong.releaseDate ? latestSong.releaseDate.toISOString() : latestSong.createdAt ? latestSong.createdAt.toISOString() : null,
        locked: false,
      };

      if (track.isEarlyAccess && !isPremium) {
        track.audioUrl = null;
        track.locked = true;
        track.lockReason = "early_access";
      }

      res.json(track);
    } catch (error) {
      console.error("Error fetching featured song:", error);
      res.status(500).json({ error: "Failed to fetch featured song" });
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

  return httpServer;
}
