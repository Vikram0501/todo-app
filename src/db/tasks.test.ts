import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "./index";
import {
  archiveTask,
  createTask,
  createTopic,
  isDueSoon,
  isOverdue,
  listArchivedTasks,
  listTasks,
} from "./tasks";

beforeEach(() => {
  resetDb(":memory:");
});

function makeTopic(name: string) {
  return createTopic(name);
}

describe("createTask / listTasks", () => {
  it("round-trips a created task with all fields", () => {
    const topic = makeTopic("Work");
    const task = createTask({
      title: "Write report",
      description: "Quarterly summary",
      due_date: "2026-08-20",
      topic_id: topic.id,
      status: "in_progress",
    });

    const all = listTasks();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      id: task.id,
      title: "Write report",
      description: "Quarterly summary",
      due_date: "2026-08-20",
      topic_id: topic.id,
      topic_name: "Work",
      status: "in_progress",
      archived_at: null,
    });
  });

  it("defaults description to empty string and status to todo", () => {
    createTask({
      title: "Minimal",
      due_date: "2026-08-15",
      topic_id: makeTopic("Home").id,
    });

    const stored = listTasks()[0];
    expect(stored.description).toBe("");
    expect(stored.status).toBe("todo");
  });
});

describe("archiveTask", () => {
  it("removes a task from the active list but keeps it in the archived list", () => {
    const topic = makeTopic("Home");
    const active = createTask({
      title: "Keep me",
      due_date: "2026-08-10",
      topic_id: topic.id,
    });
    const toArchive = createTask({
      title: "Shelve me",
      due_date: "2026-08-11",
      topic_id: topic.id,
    });

    archiveTask(toArchive.id);

    const remaining = listTasks();
    expect(remaining.map((t) => t.id)).toEqual([active.id]);

    const archived = listArchivedTasks();
    expect(archived.map((t) => t.id)).toContain(toArchive.id);
    expect(archived.map((t) => t.id)).not.toContain(active.id);
    expect(archived[0].archived_at).not.toBeNull();
  });
});

describe("isOverdue", () => {
  it("is true for a past-due task still to do", () => {
    expect(
      isOverdue({ status: "todo", archived_at: null, due_date: "2020-01-01" })
    ).toBe(true);
  });

  it("is false once the same task is complete", () => {
    expect(
      isOverdue({
        status: "complete",
        archived_at: null,
        due_date: "2020-01-01",
      })
    ).toBe(false);
  });

  it("is false for a past-due archived task", () => {
    expect(
      isOverdue({
        status: "todo",
        archived_at: "2026-01-01",
        due_date: "2020-01-01",
      })
    ).toBe(false);
  });
});

describe("isDueSoon", () => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  it("is true for a todo task due today or tomorrow", () => {
    expect(
      isDueSoon({ status: "todo", archived_at: null, due_date: today })
    ).toBe(true);
    expect(
      isDueSoon({ status: "todo", archived_at: null, due_date: tomorrow })
    ).toBe(true);
  });

  it("is false beyond a day out, when complete, when archived, or when overdue", () => {
    expect(
      isDueSoon({ status: "todo", archived_at: null, due_date: dayAfter })
    ).toBe(false);
    expect(
      isDueSoon({ status: "complete", archived_at: null, due_date: tomorrow })
    ).toBe(false);
    expect(
      isDueSoon({ status: "todo", archived_at: "2026-01-01", due_date: tomorrow })
    ).toBe(false);
    expect(
      isDueSoon({ status: "todo", archived_at: null, due_date: "2020-01-01" })
    ).toBe(false);
  });
});

describe("listTasks sorting", () => {
  it("sorts by due_date ascending when requested", () => {
    const topic = makeTopic("Work");
    createTask({ title: "later", due_date: "2026-09-01", topic_id: topic.id });
    createTask({ title: "earlier", due_date: "2026-08-01", topic_id: topic.id });

    const rows = listTasks("due_date");
    expect(rows.map((t) => t.title)).toEqual(["earlier", "later"]);
  });
});
