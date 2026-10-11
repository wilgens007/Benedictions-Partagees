import { test, expect, type Frame, type Page } from "@playwright/test";
import { getSunoEmbedUrl } from "../../client/src/lib/sunoEmbed";

// A public song from the app catalogue. Override if the owner unpublishes it.
const trackId = process.env.SUNO_TEST_TRACK_ID ?? "c4b82a31-e59b-4bfd-9445-4fa64a5b2b5b";
const audioUrl = `https://cdn1.suno.ai/${trackId}.mp3`;
const embedUrl = getSunoEmbedUrl(audioUrl);
if (!embedUrl) throw new Error("SUNO_TEST_TRACK_ID must be a valid Suno song UUID.");

async function mediaState(player: Page | Frame) {
  return player.locator("audio").evaluateAll((elements) =>
    elements.map((element) => {
      const audio = element as HTMLAudioElement;
      return {
        currentTime: audio.currentTime,
        paused: audio.paused,
        readyState: audio.readyState,
        error: audio.error ? { code: audio.error.code, message: audio.error.message } : null,
      };
    }),
  );
}

test("public Suno audio advances after a real play click", async ({ page, isMobile }, testInfo) => {
  let player: Page | Frame | undefined;
  const failures: string[] = [];
  const monitor = (target: Page) => {
    target.on("response", (response) => {
      if (response.status() >= 400 && /suno\.(com|ai)$/.test(new URL(response.url()).hostname)) {
        const url = new URL(response.url());
        // Exclude query strings, which may contain signed media credentials.
        failures.push(`${response.status()} ${url.origin}${url.pathname}`);
      }
    });
  };
  monitor(page);

  // Isolate catalogue data, not playback: no database writes, premium account,
  // or synthetic audio. Every Suno page, script and media request remains live.
  await page.route("**/api/music**", async (route) => {
    await route.fulfill({
      json: [{
        id: "suno-browser-public-track",
        title: "Public Suno playback check",
        artist: "Suno",
        duration: "3:00",
        audioUrl,
        albumArt: "",
        locked: false,
      }],
    });
  });

  try {
    await page.goto("/music");
    await page.getByTestId("card-song-suno-browser-public-track").first().click();
    const iframe = page.getByTestId("suno-embedded-player");
    const phoneLink = page.getByTestId("suno-player-open-link");
    await expect(iframe).toHaveAttribute("src", embedUrl);

    if (isMobile) {
      await expect(iframe).toBeHidden();
      await expect(phoneLink).toBeVisible();
      await expect(phoneLink).toHaveAttribute("href", embedUrl);
      const popupPromise = page.waitForEvent("popup");
      await phoneLink.click();
      const popup = await popupPromise;
      monitor(popup);
      await popup.waitForURL(embedUrl);
      await popup.waitForLoadState("domcontentloaded");
      player = popup;
    } else {
      await expect(phoneLink).toBeHidden();
      await expect(iframe).toBeVisible();
      player = await (await iframe.elementHandle())!.contentFrame() ?? undefined;
      expect(player, "Suno iframe must have a browsing context").toBeTruthy();
    }

    const suno = player!;
    await expect(suno.locator("audio")).toHaveCount(1);
    // Suno's compact embed currently has one icon-only button (no aria label).
    // Assert uniqueness so a provider redesign fails rather than clicks a guess.
    const playButton = suno.getByRole("button");
    await expect(playButton).toHaveCount(1);
    await expect(playButton).toBeVisible();
    const before = (await mediaState(suno))[0].currentTime;
    await playButton.click();
    await expect.poll(async () => {
      const [audio] = await mediaState(suno);
      // Suno can expose a forbidden placeholder before the real click resolves
      // its playable blob source. Require recovery, not merely a loaded frame.
      return !!audio && !audio.error && !audio.paused && audio.readyState >= 2
        && audio.currentTime >= before + 2;
    }, {
      timeout: 45_000,
      message: "Real Suno audio must be playing and advance at least two seconds after clicking Play",
    }).toBe(true);
    const after = (await mediaState(suno))[0];
    await testInfo.attach("playback-progress", {
      body: JSON.stringify({ project: testInfo.project.name, trackId, before, after }, null, 2),
      contentType: "application/json",
    });
  } finally {
    await testInfo.attach("suno-diagnostics", {
      body: JSON.stringify({
        trackId,
        failures,
        media: player ? await mediaState(player).catch(() => []) : [],
      }, null, 2),
      contentType: "application/json",
    });
    // Stop real playback even if an assertion failed.
    if (player) {
      await player.locator("audio").evaluateAll((elements) =>
        elements.forEach((audio) => (audio as HTMLAudioElement).pause()),
      ).catch(() => {});
    }
  }
});
