/**
 * VIDEO CONTENT CONFIGURATION
 * ===========================
 * 
 * Add your YouTube videos here! For each video, fill in:
 * - title: The name of the video
 * - description: A short description of what the video is about
 * - youtubeId: The YouTube video ID (the part after ?v= in the URL)
 * - category: "sermons", "testimonies", "worship", or "teachings"
 * 
 * HOW TO GET YOUR YOUTUBE VIDEO ID:
 * From a YouTube URL like: https://www.youtube.com/watch?v=ABC123xyz
 * The youtubeId is: ABC123xyz
 * 
 * From a short URL like: https://youtu.be/ABC123xyz
 * The youtubeId is: ABC123xyz
 */

import type { Video } from "@shared/schema";

export const videos: Video[] = [
  // ========================================
  // TEACHINGS
  // ========================================
  {
    id: "1",
    title: "Vivre une vie pleine du Saint Esprit",
    description: "Découvrez comment vivre une vie remplie du Saint Esprit et expérimenter le surnaturel de Dieu dans votre vie quotidienne.",
    youtubeId: "c0Mzyi6CqcQ",
    category: "teachings",
  },
];
