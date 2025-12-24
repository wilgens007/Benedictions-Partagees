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
 * 
 * EXAMPLE:
 * {
 *   id: "1",
 *   title: "My Video Title",
 *   description: "What this video is about...",
 *   youtubeId: "ABC123xyz",
 *   category: "sermons",
 * },
 */

import type { Video } from "@shared/schema";

export const videos: Video[] = [
  // ========================================
  // SERMONS
  // ========================================
  {
    id: "1",
    title: "The Power of Faith in Difficult Times",
    description: "A powerful message about trusting God when facing life's greatest challenges. Learn how faith can carry you through any storm.",
    youtubeId: "dQw4w9WgXcQ",
    category: "sermons",
  },
  
  // ========================================
  // TESTIMONIES
  // ========================================
  {
    id: "2",
    title: "Testimony: From Darkness to Light",
    description: "An inspiring testimony of transformation through the grace of God. Hear how one life was completely changed by faith.",
    youtubeId: "dQw4w9WgXcQ",
    category: "testimonies",
  },
  
  // ========================================
  // WORSHIP
  // ========================================
  {
    id: "3",
    title: "Live Worship: Amazing Grace",
    description: "A beautiful live worship session featuring the timeless hymn Amazing Grace. Perfect for your devotional time.",
    youtubeId: "dQw4w9WgXcQ",
    category: "worship",
  },
  
  // ========================================
  // TEACHINGS
  // ========================================
  {
    id: "4",
    title: "Bible Study: The Psalms",
    description: "Deep dive into the book of Psalms and discover the richness of David's prayers and songs of praise.",
    youtubeId: "dQw4w9WgXcQ",
    category: "teachings",
  },
  {
    id: "5",
    title: "Understanding God's Love",
    description: "A heartfelt teaching about the depth and breadth of God's unconditional love for His children.",
    youtubeId: "dQw4w9WgXcQ",
    category: "teachings",
  },
  {
    id: "6",
    title: "Prayer Warriors: How to Pray",
    description: "Learn practical tips for developing a powerful and consistent prayer life that transforms your relationship with God.",
    youtubeId: "dQw4w9WgXcQ",
    category: "teachings",
  },
];
