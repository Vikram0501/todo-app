import { listArchivedTasks } from "../../db/tasks";

export const dynamic = "force-dynamic";

export default async function ArchivedPage() {
  const tasks = listArchivedTasks();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Archived tasks</h1>
      {tasks.length === 0 ? (
        <p className="text-zinc-500">No archived tasks.</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 pr-3">Title</th>
              <th className="py-2 pr-3">Topic</th>
              <th className="py-2 pr-3">Due date</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2">Archived at</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b">
                <td className="py-2 pr-3">{task.title}</td>
                <td className="py-2 pr-3">{task.topic_name}</td>
                <td className="py-2 pr-3">{task.due_date}</td>
                <td className="py-2 pr-3">{task.status}</td>
                <td className="py-2">{task.archived_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
