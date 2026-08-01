## AI USAGE

### Models used

- Claude Sonnet 5
- DeepSeek V4 Flash

## AI Transcripts

Unfortunatly the first code generation session transcript was corrupted when saving so I have provided the session history and which phases where completed from the BUILD_SPEC.md

### Session log

- **2026-07-31 — Session 1 (planning + Phase 1):** Phase 1 complete at `80de7c9`.
  Decisions locked in and to be honoured by later phases:
  - Frontend architecture: server-rendered pages read the DAL directly; client
    components mutate via the REST API routes then call `router.refresh()`.
  - Sort controls drive a server re-fetch via `searchParams.sortBy` (default
    `due_date`); pages export `export const dynamic = "force-dynamic"` so sync
    SQLite reads are never baked into a stale prerender.
  - Topics: `<select>` of existing topics plus an "add new topic" text input;
    task `POST` accepts `topicName` and `findOrCreateTopic`s server-side.
  - Tests will run under `vitest` in the `node` environment (no jsdom) with
    `resetDb(":memory:")`, and use relative imports (no vite alias plugin).

### Progress note (updated with each phase)

- **2026-07-31 — Phase 2 complete** at `9c0be90`: `src/db/tasks.ts` shipped
  with `createTask`, `getTaskById`, `updateTask`, `archiveTask`,
  `listTasks(sortBy)`, `listArchivedTasks`, `listTopics`, `createTopic`,
  `findOrCreateTopic`, `isOverdue`. No `deleteTask` anywhere (required).
  `archiveTask` sets `archived_at` only; overdue derived in `isOverdue`, never
  stored. All DAL functions call `getDb()` per call so `resetDb()` in tests
  swaps the connection safely.

- **2026-07-31 — Phase 3 complete** at `23d6be3`: REST API under `src/app/api/`
  (`tasks` GET/POST, `tasks/[id]` GET/PATCH — no DELETE, `tasks/[id]/archive`
  POST, `topics` GET/POST). Server-side validation in `src/lib/validation.ts`
  (title required, `due_date` YYYY-MM-DD + real-date check, topic resolves to
  an id, status ∈ the three values); 400/404/405/409 with clear messages.
  Responses add a derived `overdue: boolean`. Added `getTopicById` to the DAL
  for topic validation.

- **2026-07-31 — Phase 4 complete** at `0458162`, `662dde1`, `b7ef337`:
  - `0458162` list page + sort control + nav: `src/app/page.tsx` is a server
    component reading `searchParams.sortBy` (default `due_date`); tasks come
    from the DAL directly with `overdue` computed server-side via `isOverdue`;
    `src/components/sort-control.tsx` (client) navigates to `/?sortBy=` to
    re-fetch. Pages export `export const dynamic = "force-dynamic"`.
  - `662dde1` create/edit forms: `src/components/create-task-form.tsx` (topic
    dropdown with "+ new topic" text input; POSTs to `/api/tasks` then
    `router.refresh()`); `src/components/task-row.tsx` with inline edit form
    (PATCH), status `<select>` limited to the three values, and archive button.
  - `b7ef337` `src/app/archived/page.tsx` renders `listArchivedTasks()`.
  - `next build` verified: all pages/routes render dynamic (ƒ).

---

## Handoff — session 2 (read this first)

### Current state (end of session 1, 2026-07-31)

- **Working tree is clean.** Git history (10 commits):
  `37a9931` scaffold → `80de7c9` → `9c0be90` → `168627f` (tracker) → `23d6be3`
  → `369c6a7` (tracker) → `0458162` → `662dde1` → `b7ef337` → `e42bc79` (tracker).
  All code lives on `main`.
- **Done:** phases 1–4. **Remaining:** 5 (persistence check), 6 (tests), 7 (docs),
  8 (AI transcripts), 9 (final checklist).
- `node -v` = **v24.14.1** (state "Node 24.x" in `docs/running-it.md`),
  `npm -v` = 11.11.0. `better-sqlite3@13.0.2` confirmed working on Node 24.
- This is a modified Next.js (16.2.12). Per `AGENTS.md`, read
  `node_modules/next/dist/docs/` before writing Next code. Key 16.x facts
  already relied upon: `params`/`searchParams` are **Promises** (must
  `await`); type them explicitly (`{ params: Promise<{ id: string }> }`) or
  use the generated global helpers `RouteContext`/`PageProps`; pages that read
  the SQLite DB must `export const dynamic = "force-dynamic"` (sync DB reads
  are invisible to prerender detection); Route Handlers are dynamic by
  default.
