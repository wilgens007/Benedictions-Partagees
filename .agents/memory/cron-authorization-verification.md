---
name: Cron authorization verification
description: Distinguish configured secrets, deployed runtime credentials, and successful GitHub authorization.
---

Treat secret-existence metadata and successful deployment status as configuration evidence, not proof that GitHub and the live server use matching credentials. A 401 alone cannot identify which side has the wrong value or prove that publishing is pending.

**Why:** Repeated authorization failures persisted while production secret metadata reported the key present and deployment metadata reported a successful build.

**How to apply:** Confirm authorization with a successful GitHub run and its server response or correlated production logs. Do not declare success based on a user reporting that setup is done, or infer a particular secret mismatch cause without evidence. Never retrieve or expose secret values to compare them.
