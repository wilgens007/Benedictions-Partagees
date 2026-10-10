---
name: Git authentication
description: Distinguishing Replit Git pane authorization from shell Git authentication failures.
---

The Git pane can push successfully even when the agent's shell Git commands reject their credentials. Do not treat a shell authentication failure as proof that the user's Git pane reconnection failed.

**Why:** After reconnecting GitHub, the user confirmed a successful Git pane push while shell Git reported invalid credentials. Local tracking subsequently matched the current branch.

**How to apply:** When shell authentication fails after a user reconnects, ask for the Git pane push result rather than repeatedly retrying shell commands or requesting credentials in chat. Distinguish user-confirmed success and matching local tracking from direct remote verification, which may remain inaccessible to the shell.
