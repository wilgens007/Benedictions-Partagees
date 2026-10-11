---
name: Clean-install security checks
description: Handling package-firewall failures uncovered by clean post-merge installation.
---

A working dependency tree or successful incremental install does not prove that a fresh locked installation will pass Replit's package firewall. Validate the actual post-merge hook, not just the existing app.

**Why:** A clean merge-hook installation exposed blocked packages that an existing working dependency tree had hidden. Updating direct parents alone still retained vulnerable transitive versions because their dependency ranges had not changed.

**How to apply:** Keep the firewall enabled. Update direct dependencies to the latest releases compatible with the current runtime and framework majors first. If compatible parents still retain blocked transitive versions, use same-major patched overrides and regenerate the lockfile. Then retry the complete hook and verify the application and isolated regression checks against the newly installed dependencies.
