## Third-Party Code

Every package installed beyond the Next.js default scaffold (the scaffold's own
dependencies — `next`, `react`, `react-dom`, `typescript`, `tailwindcss`,
`eslint`, etc. — are not listed here).

- **better-sqlite3** — synchronous SQLite driver; chosen because it needs no
  separate database server, fits a single-user local-first app, and its
  synchronous API avoids unnecessary async plumbing in Route Handlers.
- **@types/better-sqlite3** — TypeScript type declarations for
  `better-sqlite3`, so the DAL and test suite type-check without `any`.
- **vitest** — test runner; chosen for fast startup and native TypeScript/ESM
  support without extra config, needed for a documented single test command
  (`npm test`).

## AI Declaration

-The preceding document was generated with: OpenCode[DeepSeek V4 Flash Free (New)]