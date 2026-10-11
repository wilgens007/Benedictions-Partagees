---
name: Suno playback sources
description: The access difference between Suno’s audio CDN and its official public song player.
---

Do not rely on `cdn1.suno.ai/{uuid}.mp3` as a public audio source. Suno's CloudFront CDN can reject these unsigned URLs with `403 MissingKey`; prefer its public song page or official embed instead of proxying the protected MP3.

**Why:** The song page can remain public while the CDN media object itself requires a signed key.

**How to apply:** When integrating Suno songs, use the official `suno.com/embed/{uuid}` player, permit only Suno as a frame source, and provide a mobile link fallback. Do not fetch or copy protected audio bytes.

Do not classify the official player's initial forbidden placeholder as a permanent playback failure before trying its real Play button.

**Why:** Live desktop and phone-size browser checks observed an initial media error that recovered to a playable blob source after a user click, with actual audio progress.

**How to apply:** Browser checks must click the official control and allow bounded recovery, then require unpaused audio with advancing time and no remaining media error. Never infer success from the embed loading alone.
