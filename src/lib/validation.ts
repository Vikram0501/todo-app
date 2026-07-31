import type { TaskStatus } from "../db/tasks";

export const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "complete"];

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" && (TASK_STATUSES as string[]).includes(value)
  );
}

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
