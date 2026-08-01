"use client";

import { useRouter } from "next/navigation";
import type { SortBy } from "../db/tasks";

const OPTIONS: { value: SortBy; label: string }[] = [
  { value: "due_date", label: "Due date" },
  { value: "status", label: "Status" },
  { value: "topic", label: "Topic" },
];

export function SortControl({ current }: { current: SortBy }) {
  const router = useRouter();
  return (
    <select
      value={current}
      onChange={(e) => router.push(`/?sortBy=${e.target.value}`)}
      className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 outline-none transition-colors focus:border-zinc-500"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
