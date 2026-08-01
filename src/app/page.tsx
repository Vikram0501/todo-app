import { isOverdue, listTasks, listTopics, type SortBy } from "../db/tasks";
import { SortControl } from "../components/sort-control";
import { CreateTaskForm } from "../components/create-task-form";
import { TaskRow } from "../components/task-row";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  dot,
}: {
  label: string;
  value: number;
  dot: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sortBy?: string | string[] }>;
}) {
  const { sortBy } = await searchParams;
  const raw = typeof sortBy === "string" ? sortBy : undefined;
  const current: SortBy =
    raw === "topic" || raw === "status" || raw === "due_date"
      ? raw
      : "due_date";
  const topics = listTopics();
  const rows = listTasks(current).map((task) => ({
    ...task,
    overdue: isOverdue(task),
  }));

  const stats = {
    total: rows.length,
    todo: rows.filter((task) => task.status === "todo").length,
    inProgress: rows.filter((task) => task.status === "in_progress").length,
    complete: rows.filter((task) => task.status === "complete").length,
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <p className="text-sm text-zinc-500">
          Manage what needs doing — track, edit, and archive your tasks.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total tasks" value={stats.total} dot="bg-zinc-400" />
        <StatCard label="To start" value={stats.todo} dot="bg-amber-400" />
        <StatCard
          label="In progress"
          value={stats.inProgress}
          dot="bg-sky-400"
        />
        <StatCard label="Completed" value={stats.complete} dot="bg-emerald-400" />
      </div>

      <CreateTaskForm topics={topics} />

      <div className="flex items-center justify-end gap-2">
        <label htmlFor="sortBy" className="text-sm text-zinc-400">
          Sort by
        </label>
        <SortControl current={current} />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              <th className="px-4 py-3 font-medium text-zinc-400">Title</th>
              <th className="px-4 py-3 font-medium text-zinc-400">
                Description
              </th>
              <th className="px-4 py-3 font-medium text-zinc-400">Topic</th>
              <th className="px-4 py-3 font-medium text-zinc-400">Due date</th>
              <th className="px-4 py-3 font-medium text-zinc-400">Status</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-zinc-500">
                  No tasks yet.
                </td>
              </tr>
            ) : (
              rows.map((task) => (
                <TaskRow key={task.id} task={task} topics={topics} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
