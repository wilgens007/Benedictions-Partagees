---
name: Suno playback sources
description: The access difference between Suno’s audio CDN and its official public song player.
---

Do not rely on `cdn1.suno.ai/{uuid}.mp3` as a public audio source. Suno's CloudFront CDN can reject these unsigned URLs with `403 MissingKey`; prefer its public song page or official embed instead of proxying the protected MP3.

**Why:** The song page can remain public while the CDN media object itself requires a signed key.

**How to apply:** When integrating Suno songs, use the official `suno.com/embed/{uuid}` player, permit only Suno as a frame source, and provide a mobile link fallback. Do not fetch or copy protected audio bytes.
