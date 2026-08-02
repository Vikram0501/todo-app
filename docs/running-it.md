## Running It

### Requirements

- **Node.js 24.x** (developed on `v24.14.1` — check with `node -v`)
- **npm** (developed on `11.11.0`; any modern npm works)
- The rest is handled by `npm install`; `better-sqlite3` ships prebuilt
  binaries for Node 24, so no system SQLite is required.

### From a clean clone

```sh
git clone https://github.com/Vikram0501/todo-app.git
cd todo-app
npm install
```

There is **no manual database setup.** The first time the app reads the
database it auto-creates `data/app.db` (and the `data/` folder) from
`src/db/schema.sql`, whose `CREATE TABLE IF NOT EXISTS` guards make the
one-time initialisation safe. You do not need to run any migration or seed
step.

### Start the app

```sh
npm run dev
```

Then open **http://localhost:3000** in a browser. The root page shows the
active task list (sortable by topic, status, or due date); `/archived` shows
archived tasks.

### Run the tests

```sh
npm test
```

This runs the vitest suite (10 tests) against a throwaway in-memory database —
your real `data/app.db` is never touched.

### Other commands

- `npm run lint` — ESLint.
- `npx tsc --noEmit` — TypeScript type-check.
- `npm run build` — production build; then `npm run start`.
- `npm run clean` — delete `.next` (use this if a stale dev server starts
  404-ing every route; restart `npm run dev` afterwards).

### Configuration

The database path is read from the `DB_PATH` environment variable, defaulting
to `data/app.db` relative to the project root. Set `DB_PATH` to a temp file
(or `:memory:`) if you want the app to use a scratch database instead.
