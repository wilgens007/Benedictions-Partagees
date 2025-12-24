/**
 * MUSIC TRACKS CONFIGURATION
 * ==========================
 * 
 * Add your Suno songs here! For each song, fill in:
 * - title: The name of the song
 * - artist: The artist or "Bénédictions Partagées"
 * - duration: How long the song is (e.g., "4:32")
 * - audioUrl: Your Suno audio URL (get this from Suno's share button)
 * - albumArt: (optional) A cover image URL, or leave the default
 * 
 * HOW TO GET YOUR SUNO AUDIO URL:
 * 1. Go to your song on suno.com
 * 2. Click the share/download button
 * 3. Copy the audio URL (it looks like: https://cdn1.suno.ai/...)
 * 
 * Example:
 * {
 *   id: "1",
 *   title: "My Worship Song",
 *   artist: "Bénédictions Partagées",
 *   duration: "3:45",
 *   audioUrl: "https://cdn1.suno.ai/your-song-id.mp3",
 *   albumArt: "https://cdn2.suno.ai/image_your-song-id.jpeg",
 * },
 */

import type { MusicTrack } from "@shared/schema";

export const songs: MusicTrack[] = [
  // ========================================
  // ADD YOUR SUNO SONGS BELOW THIS LINE
  // ========================================
  
  {
    id: "1",
    title: "How Great Is Our God",
    artist: "Bénédictions Partagées",
    duration: "4:32",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Replace with your Suno URL
    albumArt: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&h=300&fit=crop",
  },
  {
    id: "2",
    title: "Amazing Grace",
    artist: "Bénédictions Partagées",
    duration: "5:18",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", // Replace with your Suno URL
    albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
  },
  {
    id: "3",
    title: "Blessed Assurance",
    artist: "Bénédictions Partagées",
    duration: "3:45",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", // Replace with your Suno URL
    albumArt: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop",
  },
  {
    id: "4",
    title: "What A Beautiful Name",
    artist: "Bénédictions Partagées",
    duration: "5:42",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", // Replace with your Suno URL
    albumArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
  },
  {
    id: "5",
    title: "Goodness of God",
    artist: "Bénédictions Partagées",
    duration: "4:53",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", // Replace with your Suno URL
    albumArt: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop",
  },
  
  // ========================================
  // ADD MORE SONGS ABOVE THIS LINE
  // ========================================
];
