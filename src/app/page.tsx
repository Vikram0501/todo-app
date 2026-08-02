import { isDueSoon, isOverdue, listTasks, listTopics, type SortBy } from "../db/tasks";
import { SortControl } from "../components/sort-control";
import { CreateTaskForm } from "../components/create-task-form";
import { TaskRow } from "../components/task-row";
import { StatusDonut } from "../components/status-donut";

export const dynamic = "force-dynamic";

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
    dueSoon: isDueSoon(task),
  }));

  const stats = {
    total: rows.length,
    todo: rows.filter((task) => task.status === "todo").length,
    inProgress: rows.filter((task) => task.status === "in_progress").length,
    complete: rows.filter((task) => task.status === "complete").length,
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <p className="text-sm text-zinc-500">
          Manage what needs doing — track, edit, and archive your tasks.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <StatusDonut
          total={stats.total}
          todo={stats.todo}
          inProgress={stats.inProgress}
          complete={stats.complete}
        />
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
