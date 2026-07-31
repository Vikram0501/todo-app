import { NextRequest } from "next/server";
import { createTopic, listTopics } from "../../../db/tasks";

export async function GET() {
  return Response.json({ topics: listTopics() });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const { name } = (body ?? {}) as Record<string, unknown>;
  if (typeof name !== "string" || name.trim() === "") {
    return Response.json({ error: "name is required." }, { status: 400 });
  }
  try {
    const topic = createTopic(name);
    return Response.json({ topic }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return Response.json(
        { error: `Topic "${name.trim()}" already exists.` },
        { status: 409 }
      );
    }
    throw err;
  }
}
