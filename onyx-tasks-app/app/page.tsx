import { Task } from '@/onyx/types';
import { headers } from 'next/headers';
import TasksClient from './components/tasks-client';

async function fetchTasks(): Promise<Task[]> {
  const headerList = await headers();
  const host = headerList.get('host');
  const protocol = headerList.get('x-forwarded-proto') ?? 'http';

  if (!host) {
    throw new Error('Unable to resolve host for task fetch');
  }

  const res = await fetch(`${protocol}://${host}/api/tasks`, { cache: 'no-store' });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Failed to fetch tasks');
  }

  return res.json();
}

export default async function Home() {
  try {
    const tasks = await fetchTasks();
    return <TasksClient initialTasks={tasks} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-zinc-50 px-6">
        <div className="max-w-lg rounded-2xl border border-rose-100 bg-white px-8 py-10 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">Error</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">Could not load tasks</h1>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
        </div>
      </main>
    );
  }
}
