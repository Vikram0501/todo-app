"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Topic } from "../db/tasks";

type TopicMode = "existing" | "new";

export function CreateTaskForm({ topics }: { topics: Topic[] }) {
  const router = useRouter();
  const [topicMode, setTopicMode] = useState<TopicMode>(
    topics.length > 0 ? "existing" : "new"
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      title: form.get("title"),
      due_date: form.get("due_date"),
    };
    const description = String(form.get("description") ?? "").trim();
    if (description) {
      payload.description = description;
    }
    if (topicMode === "existing") {
      payload.topicId = Number(form.get("topicId"));
    } else {
      payload.topicName = form.get("newTopicName");
    }
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Failed to create task.");
        return;
      }
      e.currentTarget.reset();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-2 rounded border border-zinc-200 p-3"
    >
      <label className="flex flex-col text-xs">
        Title
        <input
          name="title"
          required
          placeholder="What needs doing?"
          className="mt-1 rounded border border-zinc-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col text-xs">
        Description
        <input
          name="description"
          placeholder="Optional"
          className="mt-1 rounded border border-zinc-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col text-xs">
        Due date
        <input
          name="due_date"
          type="date"
          required
          className="mt-1 rounded border border-zinc-300 px-2 py-1 text-sm"
        />
      </label>
      {topicMode === "existing" ? (
        <label className="flex flex-col text-xs">
          Topic
          <select
            name="topicId"
            className="mt-1 rounded border border-zinc-300 px-2 py-1 text-sm"
          >
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="flex flex-col text-xs">
          New topic
          <input
            name="newTopicName"
            required
            placeholder="Topic name"
            className="mt-1 rounded border border-zinc-300 px-2 py-1 text-sm"
          />
        </label>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add task"}
      </button>
      {topicMode === "existing" ? (
        <button
          type="button"
          onClick={() => setTopicMode("new")}
          className="text-sm text-zinc-500 underline"
        >
          + New topic
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setTopicMode("existing")}
          className="text-sm text-zinc-500 underline"
        >
          Use existing topic
        </button>
      )}
      {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
