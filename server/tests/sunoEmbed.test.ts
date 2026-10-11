import { describe, expect, it } from "vitest";
import { getSunoEmbedUrl } from "../../client/src/lib/sunoEmbed";

const trackId = "c4b82a31-e59b-4bfd-9445-4fa64a5b2b5b";

describe("getSunoEmbedUrl", () => {
  it("converts a Suno CDN audio URL to Suno's official embed", () => {
    expect(getSunoEmbedUrl(`https://cdn1.suno.ai/${trackId}.mp3`))
      .toBe(`https://suno.com/embed/${trackId}`);
  });

  it("normalizes public Suno song and embed URLs", () => {
    expect(getSunoEmbedUrl(`https://suno.com/song/${trackId}`))
      .toBe(`https://suno.com/embed/${trackId}`);
    expect(getSunoEmbedUrl(`https://www.suno.com/embed/${trackId}`))
      .toBe(`https://suno.com/embed/${trackId}`);
  });

  it("does not treat unrelated or malformed URLs as Suno tracks", () => {
    expect(getSunoEmbedUrl("https://example.com/song.mp3")).toBeNull();
    expect(getSunoEmbedUrl("https://cdn1.suno.ai/not-a-track.mp3")).toBeNull();
    expect(getSunoEmbedUrl(`http://cdn1.suno.ai/${trackId}.mp3`)).toBeNull();
    expect(getSunoEmbedUrl(null)).toBeNull();
  });
});
