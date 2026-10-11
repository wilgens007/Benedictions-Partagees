const SUNO_TRACK_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Suno's MP3 CDN now requires signed access. Use Suno's official embedded
 * player for public tracks instead of assigning those protected URLs to Audio.
 */
export function getSunoEmbedUrl(audioUrl: string | null | undefined): string | null {
  if (!audioUrl) return null;

  try {
    const url = new URL(audioUrl);
    if (url.protocol !== "https:") return null;

    if (url.hostname === "cdn1.suno.ai") {
      const match = url.pathname.match(/^\/([0-9a-f-]+)\.mp3$/i);
      if (match && SUNO_TRACK_ID.test(match[1])) {
        return `https://suno.com/embed/${match[1]}`;
      }
    }

    if (url.hostname === "suno.com" || url.hostname === "www.suno.com") {
      const match = url.pathname.match(/^\/(?:song|embed)\/([0-9a-f-]+)\/?$/i);
      if (match && SUNO_TRACK_ID.test(match[1])) {
        return `https://suno.com/embed/${match[1]}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}
