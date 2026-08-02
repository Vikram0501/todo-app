import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "../../db/index";
import { GET, POST } from "./tasks/route";

beforeEach(() => {
  resetDb(":memory:");
});

describe("tasks API", () => {
  it("creates tasks and lists them sorted by due date", async () => {
    async function create(title: string, due_date: string) {
      return POST(
        new NextRequest("http://localhost/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, due_date, topicName: "Work" }),
        })
      );
    }

    const created = await create("later", "2026-09-01");
    expect(created.status).toBe(201);
    const createdBody = await created.json();
    expect(createdBody.task).toMatchObject({
      title: "later",
      topic_name: "Work",
      overdue: false,
    });

    await create("earlier", "2026-08-01");

    const list = await GET(
      new NextRequest("http://localhost/api/tasks?sortBy=due_date")
    );
    expect(list.status).toBe(200);
    const listBody = await list.json();
    expect(listBody.sortBy).toBe("due_date");
    expect(listBody.tasks.map((t: { title: string }) => t.title)).toEqual([
      "earlier",
      "later",
    ]);
  });
});
