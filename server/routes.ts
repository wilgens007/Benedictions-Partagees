import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPrayerRequestSchema } from "@shared/schema";
import type { Language } from "@shared/schema";
import { sendPrayerRequestEmail } from "./resend";
import { generateDailyContent, getTodayKeyET } from "./dailyContentGenerator";

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

  app.get("/api/music", async (req, res) => {
    try {
      const tracks = await storage.getMusicTracks();
      res.json(tracks);
    } catch (error) {
      console.error("Error fetching music tracks:", error);
      res.status(500).json({ error: "Failed to fetch music tracks" });
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
      const validation = insertPrayerRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: validation.error.issues 
        });
      }

      const prayerRequest = await storage.createPrayerRequest(validation.data);
      
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
      const requests = await storage.getPrayerRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching prayer requests:", error);
      res.status(500).json({ error: "Failed to fetch prayer requests" });
    }
  });

  return httpServer;
}
