import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPrayerRequestSchema } from "@shared/schema";
import type { Language } from "@shared/schema";

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
