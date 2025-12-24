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
 */

import type { MusicTrack } from "@shared/schema";

export const songs: MusicTrack[] = [
  // ========================================
  // RNB CREOLE PSALM - Wilgens Pierre
  // ========================================
  
  {
    id: "1",
    title: "Intro: Fondasyon Benediksyon",
    artist: "Wilgens Pierre",
    duration: "2:54",
    audioUrl: "https://cdn1.suno.ai/c4b82a31-e59b-4bfd-9445-4fa64a5b2b5b.mp3",
    albumArt: "https://cdn2.suno.ai/image_c4b82a31-e59b-4bfd-9445-4fa64a5b2b5b.jpeg",
  },
  {
    id: "2",
    title: "Chemen Lavi (Psalm 1)",
    artist: "Wilgens Pierre",
    duration: "2:39",
    audioUrl: "https://cdn1.suno.ai/754977c5-e4a5-4064-a140-1da89146af3d.mp3",
    albumArt: "https://cdn2.suno.ai/image_754977c5-e4a5-4064-a140-1da89146af3d.jpeg",
  },
  {
    id: "3",
    title: "Wa Nan Syèl La (Psalm 2)",
    artist: "Wilgens Pierre",
    duration: "2:02",
    audioUrl: "https://cdn1.suno.ai/04166a67-2453-4691-8455-862378156946.mp3",
    albumArt: "https://cdn2.suno.ai/image_04166a67-2453-4691-8455-862378156946.jpeg",
  },
  {
    id: "4",
    title: "Pwoteksyon Bondye (Psalm 3)",
    artist: "Wilgens Pierre",
    duration: "2:21",
    audioUrl: "https://cdn1.suno.ai/533499de-8d2c-455a-9681-727048f6754d.mp3",
    albumArt: "https://cdn2.suno.ai/image_533499de-8d2c-455a-9681-727048f6754d.jpeg",
  },
  {
    id: "5",
    title: "Lapriyè Nan Lannwit (Psalm 4)",
    artist: "Wilgens Pierre",
    duration: "2:07",
    audioUrl: "https://cdn1.suno.ai/be537954-6221-4c42-9993-88b6d2f34351.mp3",
    albumArt: "https://cdn2.suno.ai/image_be537954-6221-4c42-9993-88b6d2f34351.jpeg",
  },
  {
    id: "6",
    title: "Lapriyè Nan Maten (Psalm 5)",
    artist: "Wilgens Pierre",
    duration: "2:48",
    audioUrl: "https://cdn1.suno.ai/8cdd5b16-b3db-4c75-bb62-37a7b7a41341.mp3",
    albumArt: "https://cdn2.suno.ai/image_8cdd5b16-b3db-4c75-bb62-37a7b7a41341.jpeg",
  },
  {
    id: "7",
    title: "Lanmou ki Pa Janm Fini (Psalm 6)",
    artist: "Wilgens Pierre",
    duration: "2:27",
    audioUrl: "https://cdn1.suno.ai/76c4d4e0-d6df-4f53-8a2f-ad459ce2bed9.mp3",
    albumArt: "https://cdn2.suno.ai/image_76c4d4e0-d6df-4f53-8a2f-ad459ce2bed9.jpeg",
  },
  {
    id: "8",
    title: "Refij Mwen (Psalm 7)",
    artist: "Wilgens Pierre",
    duration: "3:14",
    audioUrl: "https://cdn1.suno.ai/b3af26f9-d84b-43fd-9c25-b222d5be23ab.mp3",
    albumArt: "https://cdn2.suno.ai/image_b3af26f9-d84b-43fd-9c25-b222d5be23ab.jpeg",
  },
  {
    id: "9",
    title: "Ou Gran Bondye (Psalm 8)",
    artist: "Wilgens Pierre",
    duration: "2:14",
    audioUrl: "https://cdn1.suno.ai/de9050e6-dd66-40b9-ab26-5e74b7d16d9e.mp3",
    albumArt: "https://cdn2.suno.ai/image_de9050e6-dd66-40b9-ab26-5e74b7d16d9e.jpeg",
  },
  {
    id: "10",
    title: "Chante Pou Bondye (Psalm 9)",
    artist: "Wilgens Pierre",
    duration: "3:02",
    audioUrl: "https://cdn1.suno.ai/686b539a-e38e-4b5f-a9f2-bef321661a26.mp3",
    albumArt: "https://cdn2.suno.ai/image_686b539a-e38e-4b5f-a9f2-bef321661a26.jpeg",
  },
  {
    id: "11",
    title: "Lè Bondye Gade Lwen (Psalm 10)",
    artist: "Wilgens Pierre",
    duration: "2:19",
    audioUrl: "https://cdn1.suno.ai/335cfa5c-317d-4fcd-9438-261a21949584.mp3",
    albumArt: "https://cdn2.suno.ai/image_335cfa5c-317d-4fcd-9438-261a21949584.jpeg",
  },
  {
    id: "12",
    title: "M'ap Fè Konfyans Nan Bondye (Psalm 11)",
    artist: "Wilgens Pierre",
    duration: "2:11",
    audioUrl: "https://cdn1.suno.ai/8a7806a7-23e9-4ef3-bf4b-c4c53d038fac.mp3",
    albumArt: "https://cdn2.suno.ai/image_8a7806a7-23e9-4ef3-bf4b-c4c53d038fac.jpeg",
  },
  {
    id: "13",
    title: "Lè Bondye Pale (Psalm 12)",
    artist: "Wilgens Pierre",
    duration: "2:31",
    audioUrl: "https://cdn1.suno.ai/f65e27c9-4c7b-433a-b8f2-76453b4531db.mp3",
    albumArt: "https://cdn2.suno.ai/image_f65e27c9-4c7b-433a-b8f2-76453b4531db.jpeg",
  },
  {
    id: "14",
    title: "Ou Pa Bliye Mwen (Psalm 13)",
    artist: "Wilgens Pierre",
    duration: "2:32",
    audioUrl: "https://cdn1.suno.ai/8f20ca6b-9ad3-4cd1-a68f-b094d7a297f8.mp3",
    albumArt: "https://cdn2.suno.ai/image_8f20ca6b-9ad3-4cd1-a68f-b094d7a297f8.jpeg",
  },
  {
    id: "15",
    title: "Senyè Ou Se Fòs Mwen (Psalm 14)",
    artist: "Wilgens Pierre",
    duration: "2:47",
    audioUrl: "https://cdn1.suno.ai/ac7acbdf-dcc1-4289-93f2-3b9a3bcfb4e3.mp3",
    albumArt: "https://cdn2.suno.ai/image_ac7acbdf-dcc1-4289-93f2-3b9a3bcfb4e3.jpeg",
  },
  {
    id: "16",
    title: "Lanmou ki Pa Chanje (Psalm 15)",
    artist: "Wilgens Pierre",
    duration: "2:27",
    audioUrl: "https://cdn1.suno.ai/7a05d776-8b74-4617-a571-9569b09a1de4.mp3",
    albumArt: "https://cdn2.suno.ai/image_7a05d776-8b74-4617-a571-9569b09a1de4.jpeg",
  },
  {
    id: "17",
    title: "Chemen Lavi (Psalm 16)",
    artist: "Wilgens Pierre",
    duration: "3:11",
    audioUrl: "https://cdn1.suno.ai/cbd0c393-ad77-4e5e-9cca-4e441544d7c6.mp3",
    albumArt: "https://cdn2.suno.ai/image_cbd0c393-ad77-4e5e-9cca-4e441544d7c6.jpeg",
  },
  {
    id: "18",
    title: "Pwoteksyon Mwen (Psalm 17)",
    artist: "Wilgens Pierre",
    duration: "2:42",
    audioUrl: "https://cdn1.suno.ai/f746a7e1-5eaa-4bc5-9858-201b7adfb072.mp3",
    albumArt: "https://cdn2.suno.ai/image_f746a7e1-5eaa-4bc5-9858-201b7adfb072.jpeg",
  },
  {
    id: "19",
    title: "Fòs Mwen Ou Ye (Psalm 18)",
    artist: "Wilgens Pierre",
    duration: "2:35",
    audioUrl: "https://cdn1.suno.ai/cfd209d3-bd0f-4571-93db-271d79005f67.mp3",
    albumArt: "https://cdn2.suno.ai/image_cfd209d3-bd0f-4571-93db-271d79005f67.jpeg",
  },
  {
    id: "20",
    title: "Glwa Ki Pa Janm Fini (Psalm 19)",
    artist: "Wilgens Pierre",
    duration: "2:07",
    audioUrl: "https://cdn1.suno.ai/48a3747e-be25-4acb-9f9f-136b9420660f.mp3",
    albumArt: "https://cdn2.suno.ai/image_48a3747e-be25-4acb-9f9f-136b9420660f.jpeg",
  },
  {
    id: "21",
    title: "Lanmou Bondye (Psalm 20)",
    artist: "Wilgens Pierre",
    duration: "2:36",
    audioUrl: "https://cdn1.suno.ai/c26ef04e-e03f-4455-8b1f-f511110b5160.mp3",
    albumArt: "https://cdn2.suno.ai/image_c26ef04e-e03f-4455-8b1f-f511110b5160.jpeg",
  },
];
