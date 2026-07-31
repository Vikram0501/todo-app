"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Task, TaskStatus, Topic } from "../db/tasks";

export type TaskRowData = Task & { overdue: boolean };

const STATUS_OPTIONS: TaskStatus[] = ["todo", "in_progress", "complete"];

export function TaskRow({ task, topics }: { task: TaskRowData; topics: Topic[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(status: TaskStatus) {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      router.refresh();
    }
  }

  async function archive() {
    const res = await fetch(`/api/tasks/${task.id}/archive`, {
      method: "POST",
    });
    if (res.ok) {
      router.refresh();
    }
  }

  async function saveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      title: form.get("title"),
      due_date: form.get("due_date"),
      status: form.get("status"),
      topicId: Number(form.get("topicId")),
    };
    const description = String(form.get("description") ?? "").trim();
    if (description) {
      payload.description = description;
    }
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Failed to save task.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <tr className="border-b bg-zinc-50">
        <td colSpan={6} className="py-2">
          <form onSubmit={saveEdit} className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col text-xs">
              Title
              <input
                name="title"
                required
                defaultValue={task.title}
                className="mt-1 rounded border border-zinc-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="flex flex-col text-xs">
              Description
              <input
                name="description"
                defaultValue={task.description}
                className="mt-1 rounded border border-zinc-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="flex flex-col text-xs">
              Due date
              <input
                name="due_date"
                type="date"
                required
                defaultValue={task.due_date}
                className="mt-1 rounded border border-zinc-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="flex flex-col text-xs">
              Topic
              <select
                name="topicId"
                defaultValue={task.topic_id}
                className="mt-1 rounded border border-zinc-300 px-2 py-1 text-sm"
              >
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs">
              Status
              <select
                name="status"
                defaultValue={task.status}
                className="mt-1 rounded border border-zinc-300 px-2 py-1 text-sm"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
            {error ? <span className="text-sm text-red-600">{error}</span> : null}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b">
      <td className="py-2 pr-3">{task.title}</td>
      <td className="py-2 pr-3">{task.description}</td>
      <td className="py-2 pr-3">{task.topic_name}</td>
      <td className="py-2 pr-3">
        {task.due_date}
        {task.overdue ? (
          <span className="ml-2 font-semibold text-red-600">Overdue</span>
        ) : null}
      </td>
      <td className="py-2 pr-3">
        <select
          value={task.status}
          onChange={(e) => changeStatus(e.target.value as TaskStatus)}
          className="rounded border border-zinc-300 px-2 py-1 text-sm"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mr-2 text-sm text-zinc-600 underline"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={archive}
          className="text-sm text-zinc-600 underline"
        >
          Archive
        </button>
      </td>
    </tr>
  );
}
