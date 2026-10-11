# Live Suno playback check

With the application running:

```sh
npx playwright install chromium
SUNO_TEST_BASE_URL=https://your-running-app.example npm run test:suno:browser
```

In Replit, the command also defaults to the development preview domain.
It uses the Nix-packaged Chromium configured in `.replit`, whose wrapper supplies
the required system libraries. Elsewhere it uses Playwright's installed Chromium;
`SUNO_TEST_BROWSER_PATH` can explicitly select a compatible browser executable.
`SUNO_TEST_TRACK_ID` can select another public Suno UUID if the fixture song
becomes private or is removed.

Both projects click a song in `/music`. Desktop clicks the real cross-origin
iframe's Play button; phone opens the actual mobile link and clicks Play in its
new tab. Success requires an unpaused, ready audio element whose `currentTime`
advances by at least two seconds. Playwright can inspect cross-origin frames;
the app itself does not receive or claim this playback state.

Only the application's music catalogue response is replaced with a fixed public
song; Suno scripts, responses, audio, and progress are **never mocked**. Tests do
not modify the database or need authentication. These are phone-size Chromium
checks, not physical-device or iOS Safari certification.

This is an explicit live-service smoke test, separate from `npm test`. A deleted
track, Suno outage, media denial, changed player controls, or network restriction
fails the check; it is not skipped or treated as a pass. Failed runs retain
screenshots, traces, and media/HTTP diagnostics under the ignored
`generated-artifacts/suno-browser/` directory. Traces can contain provider-signed
media URLs: do not commit or publicly share them.

Suno may initially expose a forbidden placeholder media source. The test allows
it to recover after the click, but still fails unless real progress is observed.
