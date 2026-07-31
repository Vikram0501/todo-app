import { isOverdue, listTasks, type SortBy } from "../db/tasks";
import { SortControl } from "../components/sort-control";

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
  const tasks = listTasks(current).map((task) => ({
    ...task,
    overdue: isOverdue(task),
  }));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Tasks</h1>
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
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-3 text-zinc-500">
                No tasks yet.
              </td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task.id} className="border-b">
                <td className="py-2 pr-3">{task.title}</td>
                <td className="py-2 pr-3">{task.description}</td>
                <td className="py-2 pr-3">{task.topic_name}</td>
                <td className="py-2 pr-3">
                  {task.due_date}
                  {task.overdue ? (
                    <span className="ml-2 font-semibold text-red-600">
                      Overdue
                    </span>
                  ) : null}
                </td>
                <td className="py-2">{task.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}
