# Daily devotion regression checks

Run `npm test` (all server checks) or `npm run test:devotion` (this feature).
Run `npm run test:devotion:check` for the focused TypeScript check, including the
test files that the application's main TypeScript configuration excludes.

The tests exercise the actual generator and the same Express route registration
used by the app, on an ephemeral loopback HTTP server. They cover repeated and
concurrent calls, partial-generation recovery, missing/wrong cron authorization,
Eastern midnight/year boundaries, both daylight-saving transitions, and the
two daily scheduled trigger times.

## Safety and limits

- The database module is replaced before import with per-test in-memory storage.
  No PostgreSQL pool is initialized and no real database is queried.
- Authorization is injected with a synthetic test-only credential. Tests do not
  read or modify real cron credentials.
- External `fetch` calls fail immediately. No published endpoint, Facebook API,
  or external generation service is contacted.
- The fake store models atomic unique-key insertion and PostgreSQL's `23505`
  conflict. A separate assertion checks the real schema declares that unique
  day/language index. These checks do not prove a deployed database has applied
  the index; they do not replace an isolated PostgreSQL integration test.
- The GitHub workflow and its schedule are not modified.
