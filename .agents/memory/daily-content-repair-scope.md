---
name: Daily content repair scope
description: User-approved data preservation requirements for cached devotion repairs.
---

Preserve historical daily content and notification bookkeeping when repairing today's cached verse-reference pairs.

**Why:** The user explicitly requested that historical rows and notification bookkeeping stay untouched.

**How to apply:** Use a narrowly scoped repair rather than a full-table reset. Obtain separate approval before broadening a repair to delete historical content or notification bookkeeping.

Cross-language passage alignment is separate from repairing cached daily content. Keep the existing English passage rotation when supplying matching translations; do not run a live repair as part of corpus alignment.

**Why:** The user explicitly separated multilingual alignment from the today-only cached-content repair. Changing source content is not approval to overwrite stored devotions.

**How to apply:** Validate alignment with isolated data. Existing cached rows remain unchanged until a separately approved repair; preserve their notification bookkeeping.
