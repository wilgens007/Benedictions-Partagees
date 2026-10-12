---
name: Persistent media storage
description: Storage constraints and the durable media fallback for this project.
---

Do not assume Replit App Storage has a default bucket in this project. The SDK client failed with “A bucket name is needed to use Cloud Storage” when checked. The application has a PostgreSQL media table that can persist uploaded files across republishes; local `uploads/` files cannot be relied on to persist.

**Why:** The user needs dashboard audio uploads to remain available after republishing, and an unconfigured object-storage bucket would leave uploads broken.

**How to apply:** Before switching uploads to App Storage, confirm a bucket is provisioned in the project/deployment. Until then, use the persistent database media store and account for the larger database footprint of audio files.
