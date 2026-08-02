"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Task, TaskStatus, Topic } from "../db/tasks";
import { StatusBadge, STATUS_META } from "./status-badge";

export type TaskRowData = Task & { overdue: boolean; dueSoon: boolean };

const STATUS_OPTIONS: TaskStatus[] = ["todo", "in_progress", "complete"];

const NEXT_STATUS: Partial<Record<TaskStatus, TaskStatus>> = {
  todo: "in_progress",
  in_progress: "complete",
};

const inputClass =
  "mt-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-500";

export function TaskRow({ task, topics }: { task: TaskRowData; topics: Topic[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function archive() {
    const res = await fetch(`/api/tasks/${task.id}/archive`, {
      method: "POST",
    });
    if (res.ok) {
      router.refresh();
    }
  }

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
      <tr
        className={`border-b border-zinc-800 bg-zinc-900/40 border-l-4 ${STATUS_META[task.status].accent}`}
      >
        <td colSpan={6} className="px-4 py-3">
          <form onSubmit={saveEdit} className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col text-xs text-zinc-400">
              Title
              <input
                name="title"
                required
                defaultValue={task.title}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col text-xs text-zinc-400">
              Description
              <input
                name="description"
                defaultValue={task.description}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col text-xs text-zinc-400">
              Due date
              <input
                name="due_date"
                type="date"
                required
                defaultValue={task.due_date}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col text-xs text-zinc-400">
              Topic
              <select
                name="topicId"
                defaultValue={task.topic_id}
                className={inputClass}
              >
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs text-zinc-400">
              Status
              <select
                name="status"
                defaultValue={task.status}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_META[status].label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-300"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
            >
              Cancel
            </button>
            {error ? (
              <span className="text-sm text-red-400">{error}</span>
            ) : null}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className={`border-b border-zinc-800/60 border-l-4 ${STATUS_META[task.status].accent} transition-colors hover:bg-zinc-900/40`}
    >
      <td className="px-4 py-3 font-medium">{task.title}</td>
      <td className="px-4 py-3 text-zinc-400">
        {task.description || "—"}
      </td>
      <td className="px-4 py-3">{task.topic_name}</td>
      <td className="whitespace-nowrap px-4 py-3">
        <span
          className={
            task.overdue
              ? "text-red-400"
              : task.dueSoon
                ? "text-orange-400"
                : undefined
          }
        >
          {task.due_date}
        </span>
        {task.overdue ? (
          <span className="ml-2 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400">
            Overdue
          </span>
        ) : task.dueSoon ? (
          <span className="ml-2 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-400">
            Due soon
          </span>
        ) : null}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          {NEXT_STATUS[task.status] ? (
            <button
              type="button"
              onClick={() => changeStatus(NEXT_STATUS[task.status]!)}
              title={`Move to ${STATUS_META[NEXT_STATUS[task.status]!].label}`}
              className="whitespace-nowrap rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              {STATUS_META[NEXT_STATUS[task.status]!].label} →
            </button>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mr-3 text-sm text-zinc-400 underline-offset-2 transition-colors hover:text-white hover:underline"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={archive}
          className="text-sm text-zinc-400 underline-offset-2 transition-colors hover:text-red-400 hover:underline"
        >
          Archive
        </button>
      </td>
    </tr>
  );
}
