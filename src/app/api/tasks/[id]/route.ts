import { NextRequest } from "next/server";
import {
  findOrCreateTopic,
  getTaskById,
  getTopicById,
  isOverdue,
  updateTask,
  type TaskUpdate,
} from "../../../../db/tasks";
import { isTaskStatus, isValidDateString } from "../../../../lib/validation";

type RouteCtx = { params: Promise<{ id: string }> };

function parseTaskId(id: string): number | null {
  const taskId = Number(id);
  return Number.isInteger(taskId) ? taskId : null;
}

export async function GET(request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const taskId = parseTaskId(id);
  if (taskId === null) {
    return Response.json({ error: "Invalid task id." }, { status: 400 });
  }
  const task = getTaskById(taskId);
  if (!task) {
    return Response.json({ error: `Task ${taskId} not found.` }, { status: 404 });
  }
  return Response.json({ task: { ...task, overdue: isOverdue(task) } });
}

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const taskId = parseTaskId(id);
  if (taskId === null) {
    return Response.json({ error: "Invalid task id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const { title, description, due_date, topicId, topicName, status } = (
    body ?? {}
  ) as Record<string, unknown>;

  const fields: TaskUpdate = {};

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return Response.json(
        { error: "title must be a non-empty string." },
        { status: 400 }
      );
    }
    fields.title = title.trim();
  }
  if (description !== undefined) {
    if (typeof description !== "string") {
      return Response.json(
        { error: "description must be a string." },
        { status: 400 }
      );
    }
    fields.description = description;
  }
  if (due_date !== undefined) {
    if (!isValidDateString(due_date)) {
      return Response.json(
        { error: "due_date must be a valid date in YYYY-MM-DD format." },
        { status: 400 }
      );
    }
    fields.due_date = due_date;
  }
  if (status !== undefined) {
    if (!isTaskStatus(status)) {
      return Response.json(
        { error: "status must be one of: todo, in_progress, complete." },
        { status: 400 }
      );
    }
    fields.status = status;
  }
  if (topicId !== undefined || topicName !== undefined) {
    if (typeof topicId === "number") {
      const topic = getTopicById(topicId);
      if (!topic) {
        return Response.json(
          { error: `Topic with id ${topicId} does not exist.` },
          { status: 400 }
        );
      }
      fields.topic_id = topic.id;
    } else if (typeof topicName === "string" && topicName.trim() !== "") {
      fields.topic_id = findOrCreateTopic(topicName).id;
    } else {
      return Response.json(
        { error: "topicId or topicName is required." },
        { status: 400 }
      );
    }
  }

  if (Object.keys(fields).length === 0) {
    return Response.json({ error: "No fields provided to update." }, { status: 400 });
  }

  const task = updateTask(taskId, fields);
  return Response.json({ task: { ...task, overdue: isOverdue(task) } });
}
