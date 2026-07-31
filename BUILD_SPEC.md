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
| 3 | API routes | Not started | — |
| 4 | Frontend | Not started | — |
| 5 | Persistence check | Not started | — |
| 6 | Testing | Not started | — |
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

### Progress note (updated with each phase)

- **2026-07-31 — Phase 2 complete** at `9c0be90`: `src/db/tasks.ts` shipped
  with `createTask`, `getTaskById`, `updateTask`, `archiveTask`,
  `listTasks(sortBy)`, `listArchivedTasks`, `listTopics`, `createTopic`,
  `findOrCreateTopic`, `isOverdue`. No `deleteTask` anywhere (required).
  `archiveTask` sets `archived_at` only; overdue derived in `isOverdue`, never
  stored. All DAL functions call `getDb()` per call so `resetDb()` in tests
  swaps the connection safely.

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
