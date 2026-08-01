import { listArchivedTasks } from "../../db/tasks";
import { StatusBadge } from "../../components/status-badge";

export const dynamic = "force-dynamic";

export default async function ArchivedPage() {
  const tasks = listArchivedTasks();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Archived tasks</h1>
        <p className="text-sm text-zinc-500">
          Shelved tasks are kept here — nothing is ever deleted.
        </p>
      </div>
      {tasks.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
          No archived tasks.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                <th className="px-4 py-3 font-medium text-zinc-400">Title</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Topic</th>
                <th className="px-4 py-3 font-medium text-zinc-400">
                  Due date
                </th>
                <th className="px-4 py-3 font-medium text-zinc-400">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-400">
                  Archived at
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-zinc-800/60 transition-colors hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-3 font-medium">{task.title}</td>
                  <td className="px-4 py-3 text-zinc-400">{task.topic_name}</td>
                  <td className="px-4 py-3">{task.due_date}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{task.archived_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
