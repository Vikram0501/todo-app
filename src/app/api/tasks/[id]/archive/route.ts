import { NextRequest } from "next/server";
import { archiveTask, getTaskById } from "../../../../../db/tasks";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId)) {
    return Response.json({ error: "Invalid task id." }, { status: 400 });
  }
  const existing = getTaskById(taskId);
  if (!existing) {
    return Response.json({ error: `Task ${taskId} not found.` }, { status: 404 });
  }
  const task = archiveTask(taskId);
  return Response.json({ task });
}
