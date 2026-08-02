# Build Spec: Local-First Todo App (Next.js + SQLite)

This document is a step-by-step implementation spec. Follow the phases in order.
Each phase ends with a **commit checkpoint** — commit before moving to the next
phase, with a message describing what changed and why. Do not implement
multiple phases and then commit once; the commit history is separately graded.

**Do not generate the whole application in one pass.** Work through one phase
at a time, stop, and let the developer review/test before continuing. This
matters for the AI-usage grading criterion, which specifically penalises
"whole-project generation with no input beyond the brief."

---

## Progress tracker

Workflow: one phase at a time — implement, verify, commit with the phase's
checkpoint message, then update this table and stop for review.

| # | Phase | Status | Commit |
|---|-------|--------|--------|
| 1 | Database schema | Complete | `80de7c9` |
| 2 | Data access layer | Complete | `9c0be90` |
| 3 | API routes | Complete | `23d6be3` |
| 4 | Frontend | Complete | `0458162`, `662dde1`, `b7ef337` |
| 5 | Persistence check | Not started | — |
| 6 | Testing | Complete | `145db94` |
| 7 | Documentation | Not started | — |
| 8 | AI usage transcripts | Not started | — |
| 9 | Final pre-submission checklist | Not started | — |

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

- **2026-08-01 — Session 2 (bug fix + UI revamp):** No new phases shipped;
  phases 1–4 remain complete. Work performed this sitting:
  - Fixed a runtime TypeError in `src/components/create-task-form.tsx`:
    `e.currentTarget` is `null` after `await` (React nulls the synthetic
    event's `currentTarget` once the async handler yields). Captured `formEl`
    before the `await` and reset via that reference.
  - Dark-mode UI revamp (developer-requested, cosmetic — no effect on the
    functional walkthrough): forced dark scheme in `globals.css`
    (`color-scheme: dark`, removed the light-mode media query); status
    colour-coding via new `src/components/status-badge.tsx` (amber=todo,
    sky=in_progress, emerald=complete) plus a matching coloured left border on
    each active task row; four stat-tracker cards on the list page (total /
    to start / in progress / completed, computed server-side from active
    tasks); new `src/components/nav.tsx` (sticky blurred header with an
    active-link pill); dark-styled create form, sort control, and archived
    view.
  - Added a "next status" advance button beside each task's status badge
    (todo → in_progress → complete; hidden once complete) that PATCHes and
    calls `router.refresh()`.
  - Verified with `npm run lint`, `npx tsc --noEmit`, `npm run build`, plus a
    live render check on the running dev server.
  - Developer added `AIUSAGE.md` (the AI-usage transcript, phase 8 evidence)
    and emptied `README.md` (its scaffold boilerplate is superseded by
    `docs/running-it.md` when phase 7 lands).

- **2026-08-02 — Session 3 (dev-server fix + hardening):** No new phases
  shipped; phases 1–4 remain complete. Work performed this sitting:
  - Diagnosed a reported `/archived` 404. Confirmed the data **had** persisted
    (2 tasks + 1 topic read back from `data/app.db` via a read-only query; data
    lives in the 127 KB `app.db-wal`). The real cause was a stale dev server:
    it served only `/` and 404'd `/archived` *and* `/api/tasks`, with `.next`
    artifacts from a prior session (07/31–08/01) — the in-memory route table
    was out of sync with the filesystem after an unclean shutdown.
  - Fix applied: killed the dev-server process tree, deleted `.next`, restarted
    `npm run dev`; developer confirmed all routes work again. Server was then
    stopped.
  - Hardening: added `npm run clean` (`node -e "fs.rmSync('.next',...)")`,
    cross-platform under cmd/PowerShell) to `package.json`, and documented the
    symptom + remedy in the "Known quirks" list so a future session recognises
    it immediately.

- **2026-08-02 — Session 4 (UI features + Phase 6 tests):** No new phases
  shipped until Phase 6, which landed at the end of this sitting. Work done:
  - Developer-requested UI, part 1 — status-proportion chart: the four stat
    cards on `/` were replaced by one combined "Total tasks" tracker card
    holding a single-segment donut (amber=todo, sky=in_progress,
    emerald=complete) with the total in the centre and a three-row legend
    (count + %). Pure SVG in new `src/components/status-donut.tsx` — server
    component, no client JS, no chart dependency. `STATUS_META` in
    `status-badge.tsx` gained a `hex` field so the chart and badges share one
    colour source.
  - Developer-requested UI, part 2 — "Due soon" indicator: new derived helper
    `isDueSoon(task)` in `src/db/tasks.ts` (due **today or tomorrow**, and not
    complete / not archived / not already overdue). Task rows show an orange
    "Due soon" pill + orange date text; the red "Overdue" state still wins.
    Derived at read time, never stored (consistent with the `overdue` rule).
  - Phase 6 complete at `145db94`: vitest (v4.1.10) under the `node`
    environment, `vitest.config.mts`, `"test": "vitest run"` script. Tests in
    `src/db/tasks.test.ts` (create→list round-trip, archive active-vs-archived,
    `isOverdue` past+todo→true / complete→false / archived→false, `isDueSoon`
    boundaries, `sortBy=due_date` ascending) and `src/app/api/tasks.test.ts`
    (drives the real route handlers with `NextRequest`: POST create 201, then
    GET `?sortBy=due_date` ordering). `beforeEach(() => resetDb(":memory:"))`
    keeps every test on a throwaway DB.
  - The new suite caught a real bug before it shipped: `isDueSoon` initially
    returned `true` for complete tasks (it only delegated to `isOverdue`,
    which returns `false` for complete). Fixed by checking `status`/`archived_at`
    explicitly. This is a concrete instance of a test-driven correction worth
    recording for Phase 8 evidence.
  - Verified: `npm test` (10 passing), `npm run lint`, `npx tsc --noEmit`,
    `npm run build` (all routes dynamic ƒ).

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

- **2026-08-02 — Phase 6 complete** at `145db94`: `vitest` (4.1.10) added as
  the only new devDependency; `vitest.config.mts` sets `environment: "node"`
  (no jsdom/react); `"test": "vitest run"` added to `package.json`. Every test
  starts with `beforeEach(() => resetDb(":memory:"))` — a throwaway DB, never
  the dev `app.db`. `src/db/tasks.test.ts` covers the rubric-mandated minimum
  (create→list round-trip with all fields; `archiveTask` moves a task from
  `listTasks()` into `listArchivedTasks()`; `isOverdue` past+`todo`→true and
  same task once `complete`→false) plus `isDueSoon` boundaries and
  `sortBy=due_date` ascending. `src/app/api/tasks.test.ts` drives the real
  route handlers with `NextRequest` (POST → 201, then GET
  `?sortBy=due_date`). 10 tests pass from the single documented command
  `npm test`.

---

## Handoff — session 3 (read this first)

### Current state (end of session 2, 2026-08-01)

- **Working tree is clean** (all session 2 changes committed). Git history (11
  commits, all on `main`):
  `37a9931` scaffold → `80de7c9` → `9c0be90` → `168627f` (tracker) → `23d6be3`
  → `369c6a7` (tracker) → `0458162` → `662dde1` → `b7ef337` → `e42bc79` (tracker)
  → `1aa223e` (handoff notes) → `6b279f8` (bug fix + UI revamp + AIUSAGE/README).
- **Done:** phases 1–4. **Remaining:** 5 (persistence check), 6 (tests), 7 (docs),
  8 (AI transcripts — `AIUSAGE.md` draft exists), 9 (final checklist).
- **Next action (session 3):** Phase 5 — persistence check. Prefer the automated
  route (temp `DB_PATH`, restart dev server, curl the API) or the manual route;
  then mark Phase 5 complete in the tracker, add a progress note, and stop for
  review before Phase 6 (tests).
- **Known quirks to remember this sitting:**
  - Session 2 changed the UI: status is now a colour-coded badge (amber=todo,
    sky=in_progress, emerald=complete) with a coloured left border per row and a
    "next status" advance button; status editing remains only in the edit form's
    `<select>` (still the 3 fixed values). The page shows 4 stat cards (total /
    to start / in progress / completed). Dark mode is forced via `globals.css`
    (`color-scheme: dark`).
  - A dev server may already be running on port 3000 — use it to sanity-check
    renders. If starting a second server for tests, use `-p 3123` with a temp
    `DB_PATH`.
  - **Stale-`.next` 404 symptom (hit 2026-08-02):** if a dev server only serves
    `/` and returns 404 for every other route (`/archived`, `/api/*`), the
    running server's route table is out of sync with the filesystem — usually
    `.next` survived an unclean shutdown. This is **not** a data-persistence
    problem (the DB/WAL data is intact). Remedy: kill the dev server process
    tree, run `npm run clean` (deletes `.next`; regenerates on next start), then
    restart `npm run dev`.
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

### Verification commands

- `npm run lint` and `npx tsc --noEmit` — run after every change.
- `npm run build` — full production build (verified green; all routes render
  dynamic). Type-safe, catches client/server boundary mistakes tsc alone
  misses.
- Smoke-test TS quickly with `npx --yes tsx <file>` — plain `node <file.ts>`
  type-stripping **fails on extensionless imports** (`./index`), so use tsx.
- Live API check (optional): set `$env:DB_PATH` to a temp file, start
  `cmd /c "npm run dev -- -p 3123"`, curl the endpoints, then kill stray
  processes with `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*3123*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`.
  Delete any `data/` / temp `.db` afterwards. NOTE: in this repo a `data/`
  dir may be created on first real run — it is gitignored.

### Conventions to keep honouring

- One phase at a time → verify → commit with the phase's exact checkpoint
  message → update the Progress tracker table + add a progress note → commit
  `Track phase completion in BUILD_SPEC` → stop for review.
- DAL functions call `getDb()` per call (never a module-level captured
  connection) so test `resetDb()` swaps safely. No `deleteTask` anywhere; no
  stored `overdue`; status only the 3 values; archiving only sets
  `archived_at`.
- Relative imports (not `@/`) so vitest needs no alias plugin. API route
  import depth is off-by-one-prone — recount the `..`:
  `src/app/api/tasks/route.ts`→`../../../db/tasks`;
  `src/app/api/tasks/[id]/route.ts`→`../../../../db/tasks`;
  `src/app/api/tasks/[id]/archive/route.ts`→`../../../../../db/tasks`;
  `src/app/api/topics/route.ts`→`../../../db/tasks`.

### Phase 5 — persistence check (next)

Manually: `npm run dev` (default `DB_PATH` → creates `data/app.db`), create a
task, restart the server, confirm it persists; edit + reload; archive → gone
from `/`, present at `/archived`. This mirrors walkthrough steps 3/4/7. If the
developer prefers, the agent can automate it (temp DB, restart dev server,
curl API).

### Phase 6 — tests (plan)

- `npm install -D vitest` (only new dep needed; node env, no jsdom/react).
- `vitest.config.mts`: `export default defineConfig({ test: { environment: "node" } })`.
- Add `"test": "vitest run"` to `package.json` scripts.
- Tests in `src/db/tasks.test.ts` (+ optional `src/app/api/tasks.test.ts` for
  the route-handler create/list/sort test — `next/server` already loads in
  plain node, verified). Use `beforeEach(() => resetDb(":memory:"))` — throwaway
  DB, never the dev DB. Required coverage: create→list round-trip; archive
  (active vs `listArchivedTasks`); `isOverdue` past+todo→true / complete→false;
  optional `sortBy=due_date` ascending.
- Commit checkpoint 5 message: `Add test suite with throwaway DB fixture, covering archive and overdue rules`.

### Phase 7 — docs (plan)

`docs/third-party-code.md` (better-sqlite3 + vitest, one sentence each),
`docs/database-design.md` (copy the shipped schema from Section 1, the two
tables + FK, constrained status, archiving as timestamp, overdue derived not
stored), `docs/running-it.md` (Node 24.x, clone/install/dev/test, note DB is
auto-created on first run — no manual setup). Then verify against a clean
clone in a fresh folder. Commit checkpoint 6 message:
`Add third-party code, database design, and running-it documentation`.

### Phase 8–9 — transcripts and final checklist

- This document + the saved conversation(s) are the AI-usage transcript.
  Evidence needed: constraints stated up front (this doc), a clear instance of
  rejecting/correcting an AI proposal, decisions traceable to shipped code.
  If any future proposal drifts from Section 1 (e.g. storing `overdue`, a
  `deleteTask`, a fourth status, moving archived rows to another table),
  **reject it explicitly in the conversation** and record it here — that
  rejection is the grading evidence.
- Phase 9: run the checklist at the bottom of this file. Commit count already
  exceeds the "at least 6, spread across more than one sitting" bar; later
  sessions add more.

---

## 0. Context already in place

- Next.js has already been scaffolded (App Router, TypeScript) into this repo.
- `better-sqlite3` is already installed as a dependency.
- This spec assumes you are working from that existing scaffold, not starting
  from an empty folder.

---

## 1. Database schema

Create `src/db/schema.sql`.

### Design decisions (do not deviate — these map directly to rubric requirements)

- **Two tables, not one.** `topics` and `tasks`, with `tasks.topic_id` as a
  foreign key. This gives a real relationship to document, and stops topic
  names drifting into inconsistent free text across tasks.
- **Status is a constrained text column on `tasks`**, not a separate table —
  the brief fixes the three values and forbids user customisation, so a
  `CHECK` constraint is the correct level of structure. Do not build status
  management UI.
- **Archiving is a nullable timestamp column**, `archived_at`. `NULL` = active,
  a timestamp = archived. Never delete rows. Never move archived tasks to a
  different table — that is an explicit "Partial" failure mode in the
  Database Design rubric row.
- **Overdue is never stored.** There is no `overdue` column and no `overdue`
  status. It is derived at read time from `due_date < now()` AND
  `status != 'complete'` AND `archived_at IS NULL`. Storing it, or adding it
  as a fourth status, fails both the functional walkthrough (step 6) and the
  Database Design rubric row outright.

### Schema

```sql
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL,               -- ISO 8601, e.g. 2026-08-15
  topic_id INTEGER NOT NULL REFERENCES topics(id),
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'complete')),
  archived_at TEXT DEFAULT NULL,        -- NULL = active, else ISO 8601 timestamp
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_topic ON tasks(topic_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
```

### DB connection module

Create `src/db/index.ts`:

- Opens `better-sqlite3` against a file path read from an environment
  variable (e.g. `DB_PATH`, defaulting to `./data/app.db`), **not** a
  hard-coded path — this is what lets the test suite point at a throwaway
  file instead of the developer's real data.
- On startup, runs `schema.sql` with `IF NOT EXISTS` guards so a fresh clone
  can create the DB automatically on first run (needed for functional
  walkthrough step 1 — "installs and starts by following the README alone").
- Exports a singleton `db` instance and a `resetDb(path)` helper used only by
  tests to create a fresh in-memory or temp-file database.

### Commit checkpoint 1
`git commit -m "Add SQLite schema and DB connection module"`

---

## 2. Data access layer

Create `src/db/tasks.ts` with plain functions (not an ORM — keep it
inspectable): `createTask`, `getTaskById`, `updateTask`, `archiveTask`,
`listTasks(sortBy)`, `listTopics`, `createTopic` (or `findOrCreateTopic` if
topics are entered as free text in the UI).

- `listTasks` accepts a `sortBy` param: `'topic' | 'status' | 'due_date'`,
  and only returns tasks where `archived_at IS NULL` by default; a separate
  `listArchivedTasks()` covers the "remains viewable" requirement.
- `archiveTask(id)` sets `archived_at = datetime('now')`. There must be **no**
  `deleteTask` function anywhere in the codebase — this is checked directly
  in the functional walkthrough.
- Overdue is computed in a helper, e.g. `isOverdue(task)`:
  `task.status !== 'complete' && !task.archived_at && task.due_date < today`.
  This helper is used both by the API layer (to include an `overdue: boolean`
  field in API responses) and directly by at least one test.

### Commit checkpoint 2
`git commit -m "Add task data access layer with overdue derivation"`

---

## 3. API routes (Next.js Route Handlers)

Under `src/app/api/`:

- `tasks/route.ts` — `GET` (list, accepts `?sortBy=`), `POST` (create)
- `tasks/[id]/route.ts` — `GET` (single), `PATCH` (edit/update status),
  no `DELETE` method
- `tasks/[id]/archive/route.ts` — `POST` to archive
- `topics/route.ts` — `GET` (list existing topics for a dropdown), `POST` if
  you want free-text topic creation

Validate input server-side (title required, due_date parses as a valid date,
topic resolves to an id, status is one of the three allowed values). Return
4xx with a clear message on invalid input rather than throwing.

### Commit checkpoint 3
`git commit -m "Add REST API routes for task CRUD and archiving"`

---

## 4. Frontend

Build incrementally, one page/component at a time, each as its own commit:

1. **List page** (`src/app/page.tsx`): fetches active tasks, renders a table
   or card list showing all four fields plus status and an overdue
   indicator. Sort controls (topic / status / due date) as buttons, tabs, or
   a `<select>` — re-fetch or re-sort client-side on change.
   - Overdue indication must be visually distinct from status (e.g. a red
     label or icon next to the due date) and must **not** appear as a fourth
     option anywhere the three statuses are selected.
2. **Create task form**: all four fields, topic as a dropdown of existing
   topics (with an "add new topic" option) or free text — your call, document
   whichever you pick.
3. **Edit task view/modal**: pre-filled form, saves via `PATCH`, and status
   changes via a `<select>` limited to the three fixed values.
4. **Archive action**: a button on each task; archiving removes it from the
   default list view.
5. **Archived tasks view**: a separate page or filter (e.g. `/archived`) so
   archived tasks remain viewable, satisfying "cannot be deleted, only
   archived, so that it remains viewable."

Keep styling minimal and functional — the brief says cosmetic defects are not
penalised in the functional walkthrough, and cosmetics aren't part of the
72-mark rubric either. Don't spend time here.

### Commit checkpoint 4 (one commit per component/page is fine, e.g.)
- `git commit -m "Add task list page with sorting and overdue indicator"`
- `git commit -m "Add create/edit task forms"`
- `git commit -m "Add archive action and archived tasks view"`

---

## 5. Persistence check (manual, before moving on)

Before writing tests, manually verify:
- Create a task, restart `npm run dev`, confirm it's still there.
- Edit a task, reload the page, confirm the change survived.
- Archive a task, confirm it disappears from the active list but is visible
  in the archived view.

This is exactly what the functional walkthrough (steps 3, 4, 7) will check,
so confirming it manually now avoids failing the walkthrough later.

---

## 6. Testing

This is graded on a specific set of failure modes — read the constraints
before writing tests, not after:

- **Tests must run against a throwaway database**, never the developer's
  real `app.db`. Point `DB_PATH` (or equivalent) at a temp file or
  `:memory:` in a test setup/teardown hook, and rebuild the schema fresh for
  each test run.
- **Tests must run from a single documented command** — e.g. `npm test`. Do
  not require the developer to manually seed data or start the dev server
  first.
- **At least one test must cover archiving**, and **at least one must cover
  the overdue rule** (both are named explicitly in the rubric's top-band
  description).
- Tests must assert real behaviour — not render-only smoke tests, not
  tautological assertions (e.g. `expect(true).toBe(true)`).

Suggested minimum test set (use `vitest` — lighter than Jest for this size of
project, and works cleanly with TypeScript and ESM out of the box):

1. `createTask` then `listTasks` returns the created task with correct
   fields.
2. `archiveTask` removes a task from `listTasks()` (active list) but it still
   appears in `listArchivedTasks()`.
3. `isOverdue` returns `true` for a task with a past `due_date` and status
   `'todo'`, and `false` for the same task once its status is `'complete'`.
4. (Optional, recommended) An API-level test hitting the route handler
   directly for create + list, to prove sorting works (`sortBy=due_date`
   returns tasks in ascending date order).

Add to `package.json`:
```json
"scripts": {
  "test": "vitest run"
}
```

### Commit checkpoint 5
`git commit -m "Add test suite with throwaway DB fixture, covering archive and overdue rules"`

---

## 7. Documentation

Create a `/docs` folder with three files. These are graded for specificity —
generic or templated content scores lower than content that names your
actual schema, actual dependencies, and actual commands.

### `docs/third-party-code.md`
A short list of every package you installed beyond the Next.js default
scaffold (not the default scaffold's own dependencies), each with one
sentence on why. E.g.:

```md
## Third-Party Code

- **better-sqlite3** — synchronous SQLite driver; chosen because it needs no
  separate database server, fits a single-user local-first app, and its
  synchronous API avoids unnecessary async plumbing in Route Handlers.
- **vitest** — test runner; chosen for fast startup and native TypeScript/ESM
  support without extra config, needed for a documented single test command.
```

### `docs/database-design.md`
Must show the actual shipped schema (copy it in, or a clear diagram) and, in
prose, describe:
- The two tables and the foreign key relationship between them.
- Why status is constrained but not a separate table.
- How archiving works (flag/timestamp, not deletion, not a copy).
- How overdue is derived, and confirmation that it is not stored anywhere.

### `docs/running-it.md`
Must let a reader start the app **from a clean clone with nothing else to
hand**. Include:
- Exact Node version required (check with `node -v` on your machine and
  state it, e.g. "Node 20.x").
- `git clone <url>`
- `npm install`
- Any one-time setup step (e.g. does the DB file/folder need creating, or
  does the app do this automatically on first run? If manual, give the exact
  command).
- `npm run dev` to start it, and the URL to open.
- `npm test` to run the test suite.

Before finishing this phase, actually re-run these exact commands from a
fresh clone in a different folder to confirm nothing is missing — this is
literally how it will be marked (functional walkthrough step 1, and the top
band of the Documentation rubric row explicitly requires verification
"against a clean clone").

### Commit checkpoint 6
`git commit -m "Add third-party code, database design, and running-it documentation"`

---

## 8. AI usage transcripts

Export/save the planning and build conversation(s) used to produce this
project (this document counts as part of that). The rubric's top band
specifically wants to see:
- Constraints stated up front (this document is that).
- At least one clear instance where you rejected, corrected, or redirected
  an AI-generated output rather than accepting everything as given.
- Decisions in the transcript that are traceable to what actually shipped.

If opencode proposes something that deviates from Section 1's schema
decisions (e.g. storing `overdue` as a column, or a `deleteTask` function),
reject it explicitly and note why in the conversation — don't silently fix it
in a later edit. That rejection is itself evidence for this criterion.

---

## 9. Final pre-submission checklist

Run through this yourself before submitting, matching the functional
walkthrough exactly:

- [ ] Clean clone + `npm install` + `npm run dev` works with no extra steps
      beyond what's in `running-it.md`
- [ ] Create a task with all four fields — appears in the list
- [ ] Edit a task — change survives a page reload
- [ ] Archive a task — disappears from active list, still viewable elsewhere
- [ ] List sorts correctly by topic, by status, by due date
- [ ] Overdue task is visibly flagged; overdue is not a selectable status
- [ ] Stop and restart the app — all data still there
- [ ] `npm test` runs 3+ tests, including archive and overdue, against a
      throwaway DB, from a single documented command
- [ ] All three docs present, specific, and match the shipped code
- [ ] At least 6 commits, meaningful messages, spread across more than one
      sitting
- [ ] AI usage transcripts saved, showing at least one rejected/corrected
      output
