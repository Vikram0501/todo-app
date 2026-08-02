## Database Design

This app stores its data in a single SQLite database. The exact schema shipped
with the app is `src/db/schema.sql`, reproduced here verbatim:

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

### The two tables and their relationship

There are exactly two tables: `topics` and `tasks`. A `task` belongs to exactly
one `topic`, expressed by the foreign key `tasks.topic_id REFERENCES
topics(id)`. Topics are normalised into their own table so their names stay
consistent — the UI offers existing topics as a dropdown and only creates a new
row when the user types a genuinely new one. `topics.name` is `UNIQUE`, which
is what lets the data-access layer use `findOrCreateTopic` to resolve a name to
an id before a task is inserted.

### Why status is a constrained column, not a separate table

`tasks.status` is a text column constrained by `CHECK (status IN ('todo',
'in_progress', 'complete'))`. The brief fixes exactly these three values and
forbids user customisation, so a `CHECK` constraint gives the right level of
structure — the database itself rejects any fourth value. A separate `status`
lookup table (or a status-management UI) is deliberately not built, because the
value set is fixed and there is nothing to manage.

### How archiving works

Archiving is a nullable timestamp column, `archived_at`. `NULL` means the task
is active; a timestamp means it is archived. The archive operation sets only
this column (`archiveTask` runs
`UPDATE tasks SET archived_at = datetime('now') WHERE id = ?`). Tasks are
**never deleted** — there is no `deleteTask` function anywhere in the codebase
— and archived tasks are **never copied or moved to another table**: they stay
in `tasks`, the archived view is just a read filtered on `archived_at IS NOT
NULL`. Because it is a timestamp rather than a flag, the original archive time
is preserved, which also keeps the ordering of the archived view meaningful.

### How overdue is derived (and that it is not stored)

A task is overdue when:

```
due_date < today  AND  status != 'complete'  AND  archived_at IS NULL
```

This is computed at read time by the `isOverdue(task)` helper in
`src/db/tasks.ts`. There is **no** `overdue` column, and `overdue` is **not** a
fourth status value — it is never stored anywhere. The API responses include a
derived `overdue: boolean` field, and the list page computes the same flag
server-side, but both derive it fresh from the three stored fields above so it
can never go stale as dates and statuses change.
