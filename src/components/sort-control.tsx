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
      className="rounded border border-zinc-300 px-2 py-1"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
