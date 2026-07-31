import { NextRequest } from "next/server";
import {
  createTask,
  findOrCreateTopic,
  getTopicById,
  isOverdue,
  listTasks,
  type SortBy,
} from "../../../db/tasks";
import { isTaskStatus, isValidDateString } from "../../../lib/validation";

const SORT_BY_VALUES: SortBy[] = ["topic", "status", "due_date"];

export async function GET(request: NextRequest) {
  const rawSortBy = request.nextUrl.searchParams.get("sortBy");
  let sortBy: SortBy = "due_date";
  if (rawSortBy !== null) {
    if (!(SORT_BY_VALUES as string[]).includes(rawSortBy)) {
      return Response.json(
        {
          error: `Invalid sortBy "${rawSortBy}". Must be one of: ${SORT_BY_VALUES.join(", ")}.`,
        },
        { status: 400 }
      );
    }
    sortBy = rawSortBy as SortBy;
  }
  const tasks = listTasks(sortBy).map((task) => ({
    ...task,
    overdue: isOverdue(task),
  }));
  return Response.json({ tasks, sortBy });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const { title, description, due_date, topicId, topicName, status } = (
    body ?? {}
  ) as Record<string, unknown>;

  if (typeof title !== "string" || title.trim() === "") {
    return Response.json({ error: "title is required." }, { status: 400 });
  }
  if (!isValidDateString(due_date)) {
    return Response.json(
      { error: "due_date must be a valid date in YYYY-MM-DD format." },
      { status: 400 }
    );
  }
  if (status !== undefined && !isTaskStatus(status)) {
    return Response.json(
      { error: "status must be one of: todo, in_progress, complete." },
      { status: 400 }
    );
  }

  let topic_id: number;
  if (typeof topicId === "number") {
    const topic = getTopicById(topicId);
    if (!topic) {
      return Response.json(
        { error: `Topic with id ${topicId} does not exist.` },
        { status: 400 }
      );
    }
    topic_id = topic.id;
  } else if (typeof topicName === "string" && topicName.trim() !== "") {
    topic_id = findOrCreateTopic(topicName).id;
  } else {
    return Response.json(
      { error: "topicId or topicName is required." },
      { status: 400 }
    );
  }

  const task = createTask({
    title: title.trim(),
    description: typeof description === "string" ? description : "",
    due_date,
    topic_id,
    status: isTaskStatus(status) ? status : undefined,
  });
  return Response.json({ task: { ...task, overdue: isOverdue(task) } }, { status: 201 });
}
