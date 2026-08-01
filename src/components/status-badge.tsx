import type { TaskStatus } from "../db/tasks";

export const STATUS_META: Record<
  TaskStatus,
  { label: string; badge: string; dot: string; accent: string }
> = {
  todo: {
    label: "To start",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
    accent: "border-l-amber-400",
  },
  in_progress: {
    label: "In progress",
    badge: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    dot: "bg-sky-400",
    accent: "border-l-sky-400",
  },
  complete: {
    label: "Complete",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
    accent: "border-l-emerald-400",
  },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
