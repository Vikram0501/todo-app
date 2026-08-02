import type { TaskStatus } from "../db/tasks";
import { STATUS_META } from "./status-badge";

const SIZE = 120;
const CENTER = SIZE / 2;
const RADIUS = 44;
const STROKE_WIDTH = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SEGMENTS: TaskStatus[] = ["todo", "in_progress", "complete"];

export function StatusDonut({
  total,
  todo,
  inProgress,
  complete,
}: {
  total: number;
  todo: number;
  inProgress: number;
  complete: number;
}) {
  const counts: Record<TaskStatus, number> = {
    todo,
    in_progress: inProgress,
    complete,
  };

  const arcs = SEGMENTS.filter(
    (status) => total > 0 && counts[status] > 0
  ).reduce<
    { status: TaskStatus; length: number; offset: number }[]
  >((acc, status) => {
    const length = (counts[status] / total) * CIRCUMFERENCE;
    const offset = -acc.reduce((sum, arc) => sum + arc.length, 0);
    acc.push({ status, length, offset });
    return acc;
  }, []);

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`${total} tasks: ${todo} to start, ${inProgress} in progress, ${complete} complete`}
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="#27272a"
            strokeWidth={STROKE_WIDTH}
          />
          <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
            {arcs.map((arc) => (
              <circle
                key={arc.status}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={STATUS_META[arc.status].hex}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
                strokeDashoffset={arc.offset}
              />
            ))}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-white">
            {total}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            tasks
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-2.5">
        {SEGMENTS.map((status) => {
          const meta = STATUS_META[status];
          const count = counts[status];
          const percent = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <li key={status} className="flex items-center gap-2.5">
              <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
              <span className="w-24 text-sm text-zinc-400">{meta.label}</span>
              <span className="text-sm font-semibold tabular-nums text-white">
                {count}
              </span>
              <span className="w-10 text-right text-xs tabular-nums text-zinc-500">
                {total > 0 ? `${percent}%` : "—"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
