"use server";

import { revalidatePath } from "next/cache";
import {
  archiveTask,
  createTask,
  findOrCreateTopic,
  getTaskById,
  getTopicById,
  updateTask,
  type TaskStatus,
  type TaskUpdate,
} from "./db/tasks";
import { isTaskStatus, isValidDateString } from "./lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

function parseTaskId(id: unknown): number | null {
  if (typeof id !== "number" || !Number.isInteger(id)) {
    return null;
  }
  return id;
}

export async function archiveTaskAction(id: unknown): Promise<ActionResult> {
  const taskId = parseTaskId(id);
  if (taskId === null) {
    return { ok: false, error: "Invalid task id." };
  }
  const existing = getTaskById(taskId);
  if (!existing) {
    return { ok: false, error: `Task ${taskId} not found.` };
  }
  archiveTask(taskId);
  revalidatePath("/");
  revalidatePath("/archived");
  return { ok: true };
}

export async function updateTaskAction(
  id: unknown,
  input: Record<string, unknown>
): Promise<ActionResult> {
  const taskId = parseTaskId(id);
  if (taskId === null) {
    return { ok: false, error: "Invalid task id." };
  }
  const body = input ?? {};

  const fields: TaskUpdate = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim() === "") {
      return { ok: false, error: "title must be a non-empty string." };
    }
    fields.title = body.title.trim();
  }
  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      return { ok: false, error: "description must be a string." };
    }
    fields.description = body.description;
  }
  if (body.due_date !== undefined) {
    if (!isValidDateString(body.due_date)) {
      return { ok: false, error: "due_date must be a valid date in YYYY-MM-DD format." };
    }
    fields.due_date = body.due_date;
  }
  if (body.status !== undefined) {
    if (!isTaskStatus(body.status)) {
      return { ok: false, error: "status must be one of: todo, in_progress, complete." };
    }
    fields.status = body.status;
  }
  if (body.topicId !== undefined || body.topicName !== undefined) {
    if (typeof body.topicId === "number") {
      const topic = getTopicById(body.topicId);
      if (!topic) {
        return { ok: false, error: `Topic with id ${body.topicId} does not exist.` };
      }
      fields.topic_id = topic.id;
    } else if (typeof body.topicName === "string" && body.topicName.trim() !== "") {
      fields.topic_id = findOrCreateTopic(body.topicName).id;
    } else {
      return { ok: false, error: "topicId or topicName is required." };
    }
  }

  if (Object.keys(fields).length === 0) {
    return { ok: false, error: "No fields provided to update." };
  }

  updateTask(taskId, fields);
  revalidatePath("/");
  return { ok: true };
}

export async function createTaskAction(
  input: Record<string, unknown>
): Promise<ActionResult> {
  const body = input ?? {};

  if (typeof body.title !== "string" || body.title.trim() === "") {
    return { ok: false, error: "title is required." };
  }
  if (!isValidDateString(body.due_date)) {
    return { ok: false, error: "due_date must be a valid date in YYYY-MM-DD format." };
  }
  if (body.status !== undefined && !isTaskStatus(body.status)) {
    return { ok: false, error: "status must be one of: todo, in_progress, complete." };
  }

  let topic_id: number;
  if (typeof body.topicId === "number") {
    const topic = getTopicById(body.topicId);
    if (!topic) {
      return { ok: false, error: `Topic with id ${body.topicId} does not exist.` };
    }
    topic_id = topic.id;
  } else if (typeof body.topicName === "string" && body.topicName.trim() !== "") {
    topic_id = findOrCreateTopic(body.topicName).id;
  } else {
    return { ok: false, error: "topicId or topicName is required." };
  }

  createTask({
    title: body.title.trim(),
    description: typeof body.description === "string" ? body.description : "",
    due_date: body.due_date as string,
    topic_id,
    status: isTaskStatus(body.status) ? (body.status as TaskStatus) : undefined,
  });
  revalidatePath("/");
  return { ok: true };
}
