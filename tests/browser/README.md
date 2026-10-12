# Live Suno playback check

With the application running:

```sh
npx playwright install chromium webkit
SUNO_TEST_BASE_URL=https://your-running-app.example npm run test:suno:browser
```

The default command runs the desktop and phone Chromium projects.
To include the optional iPhone-sized WebKit emulation project, set
`SUNO_TEST_WEBKIT=1` and pass `--project=iphone-webkit-emulation`.

In Replit, the command also defaults to the development preview domain.
It uses the Nix-packaged Chromium configured in `.replit`, whose wrapper supplies
the required system libraries. Elsewhere it uses Playwright's installed Chromium;
`SUNO_TEST_BROWSER_PATH` can explicitly select a compatible browser executable.
`SUNO_TEST_TRACK_ID` can select another public Suno UUID if the fixture song
becomes private or is removed.

All projects click a song in `/music`. Desktop clicks the real cross-origin
iframe's Play button; phone projects open the actual mobile link and click Play
in its new tab. Success requires an unpaused, ready audio element whose
`currentTime` advances by at least two seconds. Playwright can inspect
cross-origin frames; the app itself does not receive or claim this playback
state.

Only the application's music catalogue response is replaced with a fixed public
song; Suno scripts, responses, audio, and progress are **never mocked**. Tests do
not modify the database or need authentication. The iPhone WebKit project runs
Playwright's WebKit build on the host OS with iPhone-sized viewport, touch, and
mobile-link behavior. It is not MobileSafari on iOS and cannot certify iOS
version-specific behavior or a physical iPhone; confirm those separately on an
actual iPhone when one is available.

This Replit Linux environment cannot launch the Playwright WebKit build because
it requires Ubuntu-specific media-library ABIs that are not available through
the project's Nix system packages. The WebKit project must be run on a supported
host; a passing run there still does not equal iOS Safari or device certification.

This is an explicit live-service smoke test, separate from `npm test`. A deleted
track, Suno outage, media denial, changed player controls, or network restriction
fails the check; it is not skipped or treated as a pass. Failed runs retain
screenshots, traces, and media/HTTP diagnostics under the ignored
`generated-artifacts/suno-browser/` directory. Traces can contain provider-signed
media URLs: do not commit or publicly share them.

Suno may initially expose a forbidden placeholder media source. The test allows
it to recover after the click, but still fails unless real progress is observed.
