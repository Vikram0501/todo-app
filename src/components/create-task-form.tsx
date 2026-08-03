"use client";

import { useState, type FormEvent } from "react";
import type { Topic } from "../db/tasks";
import { createTaskAction } from "../actions";

type TopicMode = "existing" | "new";

export function CreateTaskForm({ topics }: { topics: Topic[] }) {
  const [topicMode, setTopicMode] = useState<TopicMode>(
    topics.length > 0 ? "existing" : "new"
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
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
      const result = await createTaskAction(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      formEl.reset();
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "mt-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-500";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
    >
      <label className="flex flex-col text-xs text-zinc-400">
        Title
        <input
          name="title"
          required
          placeholder="What needs doing?"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col text-xs text-zinc-400">
        Description
        <input
          name="description"
          placeholder="Optional"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col text-xs text-zinc-400">
        Due date
        <input name="due_date" type="date" required className={inputClass} />
      </label>
      {topicMode === "existing" ? (
        <label className="flex flex-col text-xs text-zinc-400">
          Topic
          <select name="topicId" className={inputClass}>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="flex flex-col text-xs text-zinc-400">
          New topic
          <input
            name="newTopicName"
            required
            placeholder="Topic name"
            className={inputClass}
          />
        </label>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-300 disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add task"}
      </button>
      {topicMode === "existing" ? (
        <button
          type="button"
          onClick={() => setTopicMode("new")}
          className="text-sm text-zinc-400 underline underline-offset-2 transition-colors hover:text-zinc-200"
        >
          + New topic
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setTopicMode("existing")}
          className="text-sm text-zinc-400 underline underline-offset-2 transition-colors hover:text-zinc-200"
        >
          Use existing topic
        </button>
      )}
      {error ? <p className="w-full text-sm text-red-400">{error}</p> : null}
    </form>
  );
}
