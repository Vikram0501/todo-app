import { getDb } from "./index";

export type TaskStatus = "todo" | "in_progress" | "complete";
export type SortBy = "topic" | "status" | "due_date";

export interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  topic_id: number;
  topic_name: string;
  status: TaskStatus;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: number;
  name: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  due_date: string;
  topic_id: number;
  status?: TaskStatus;
}

const UPDATEABLE_FIELDS = [
  "title",
  "description",
  "due_date",
  "topic_id",
  "status",
] as const;

export type TaskUpdate = Partial<
  Pick<Task, "title" | "description" | "due_date" | "topic_id" | "status">
>;

const SELECT_WITH_TOPIC = `
  SELECT tasks.*, topics.name AS topic_name
  FROM tasks
  JOIN topics ON tasks.topic_id = topics.id
`;

const ORDER_BY: Record<SortBy, string> = {
  topic: "topics.name COLLATE NOCASE, tasks.id",
  status: "tasks.status, tasks.id",
  due_date: "tasks.due_date, tasks.id",
};

export function getTaskById(id: number): Task | undefined {
  const db = getDb();
  return db
    .prepare(`${SELECT_WITH_TOPIC} WHERE tasks.id = ?`)
    .get(id) as Task | undefined;
}

export function createTask(input: TaskInput): Task {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO tasks (title, description, due_date, topic_id, status)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      input.title,
      input.description ?? "",
      input.due_date,
      input.topic_id,
      input.status ?? "todo"
    );
  const task = getTaskById(result.lastInsertRowid as number);
  if (!task) {
    throw new Error("Failed to create task");
  }
  return task;
}

export function updateTask(id: number, fields: TaskUpdate): Task {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const field of UPDATEABLE_FIELDS) {
    if (field in fields) {
      sets.push(`${field} = ?`);
      values.push(fields[field]);
    }
  }
  if (sets.length === 0) {
    throw new Error("No fields provided to update");
  }
  sets.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  const task = getTaskById(id);
  if (!task) {
    throw new Error(`Task ${id} not found`);
  }
  return task;
}

export function archiveTask(id: number): Task {
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE tasks SET archived_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
    )
    .run(id);
  if (result.changes === 0) {
    throw new Error(`Task ${id} not found`);
  }
  const task = getTaskById(id);
  if (!task) {
    throw new Error(`Task ${id} not found`);
  }
  return task;
}

export function listTasks(sortBy: SortBy = "due_date"): Task[] {
  const db = getDb();
  return db
    .prepare(
      `${SELECT_WITH_TOPIC} WHERE tasks.archived_at IS NULL ORDER BY ${ORDER_BY[sortBy]}`
    )
    .all() as Task[];
}

export function listArchivedTasks(): Task[] {
  const db = getDb();
  return db
    .prepare(
      `${SELECT_WITH_TOPIC} WHERE tasks.archived_at IS NOT NULL ORDER BY tasks.archived_at DESC, tasks.id`
    )
    .all() as Task[];
}

export function getTopicById(id: number): Topic | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM topics WHERE id = ?`).get(id) as Topic | undefined;
}

export function listTopics(): Topic[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM topics ORDER BY name COLLATE NOCASE`)
    .all() as Topic[];
}

export function createTopic(name: string): Topic {
  const db = getDb();
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Topic name is required");
  }
  const result = db.prepare(`INSERT INTO topics (name) VALUES (?)`).run(trimmed);
  return { id: result.lastInsertRowid as number, name: trimmed };
}

export function findOrCreateTopic(name: string): Topic {
  const db = getDb();
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Topic name is required");
  }
  const existing = db
    .prepare(`SELECT * FROM topics WHERE name = ? COLLATE NOCASE LIMIT 1`)
    .get(trimmed) as Topic | undefined;
  if (existing) {
    return existing;
  }
  try {
    return createTopic(trimmed);
  } catch {
    const row = db
      .prepare(`SELECT * FROM topics WHERE name = ? COLLATE NOCASE LIMIT 1`)
      .get(trimmed) as Topic | undefined;
    if (row) {
      return row;
    }
    throw new Error(`Failed to create topic "${trimmed}"`);
  }
}

export function isOverdue(
  task: Pick<Task, "status" | "archived_at" | "due_date">
): boolean {
  if (task.status === "complete" || task.archived_at) {
    return false;
  }
  const today = new Date().toISOString().slice(0, 10);
  return task.due_date < today;
}

export function isDueSoon(
  task: Pick<Task, "status" | "archived_at" | "due_date">
): boolean {
  if (task.status === "complete" || task.archived_at || isOverdue(task)) {
    return false;
  }
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return task.due_date === today || task.due_date === tomorrow;
}
