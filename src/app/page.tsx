import { isOverdue, listTasks, listTopics, type SortBy } from "../db/tasks";
import { SortControl } from "../components/sort-control";
import { CreateTaskForm } from "../components/create-task-form";
import { TaskRow } from "../components/task-row";

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
  }));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <CreateTaskForm topics={topics} />
      <div className="flex items-center gap-2">
        <label htmlFor="sortBy">Sort by</label>
        <SortControl current={current} />
      </div>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 pr-3">Title</th>
            <th className="py-2 pr-3">Description</th>
            <th className="py-2 pr-3">Topic</th>
            <th className="py-2 pr-3">Due date</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-3 text-zinc-500">
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
    </main>
  );
}
