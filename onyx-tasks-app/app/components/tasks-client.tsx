'use client';

import { Task } from '@/onyx/types';
import { FormEvent, useMemo, useState } from 'react';

type Props = {
  initialTasks: Task[];
};

type FormState = {
  title: string;
  description: string;
  dueDate: string;
};

const toDateInputValue = (dueDate?: string | Date | null) => {
  if (!dueDate) return '';
  const date = dueDate instanceof Date ? dueDate : new Date(dueDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formatDueDate = (dueDate?: string | Date | null) => {
  if (!dueDate) return 'No due date';
  const date = dueDate instanceof Date ? dueDate : new Date(dueDate);
  if (Number.isNaN(date.getTime())) return 'No due date';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const normalizeTask = (task: Task): Task => {
  if (!task.dueDate) {
    return { ...task, dueDate: undefined };
  }

  const parsed = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
  if (Number.isNaN(parsed.getTime())) {
    return { ...task, dueDate: undefined };
  }

  return { ...task, dueDate: parsed };
};

export default function TasksClient({ initialTasks }: Props) {
  const [tasks, setTasks] = useState<Task[]>(() => initialTasks.map(normalizeTask));
  const [form, setForm] = useState<FormState>({ title: '', description: '', dueDate: '' });
  const [editForm, setEditForm] = useState<FormState>({ title: '', description: '', dueDate: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const taskCount = useMemo(() => tasks.length, [tasks]);

  const resetStatus = () => {
    setMessage(null);
    setError(null);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    resetStatus();

    if (!form.title.trim() || !form.dueDate) {
      setError('Title and due date are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          dueDate: new Date(form.dueDate).toISOString(),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create task');
      }

      const data = await res.json();
      const saved: Task | undefined = data.task;
      if (saved) {
        setTasks((prev) => [normalizeTask(saved), ...prev]);
      }

      setForm({ title: '', description: '', dueDate: '' });
      setMessage('Task created');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create task';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const applyUpdate = (updated: Task) => {
    setTasks((prev) =>
      prev.map((task) => (task.id && updated.id && task.id === updated.id ? normalizeTask(updated) : task)),
    );
  };

  const handleToggleComplete = async (task: Task) => {
    if (!task.id) return;
    resetStatus();
    setSavingId(task.id);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update task');
      }

      const data = await res.json();
      if (data.task) {
        applyUpdate(data.task);
        setMessage(`Marked as ${data.task.completed ? 'completed' : 'open'}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update task';
      setError(msg);
    } finally {
      setSavingId(null);
    }
  };

  const startEdit = (task: Task) => {
    if (!task.id) return;
    setEditingId(task.id);
    setEditForm({
      title: task.title ?? '',
      description: task.description ?? '',
      dueDate: toDateInputValue(task.dueDate),
    });
    resetStatus();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', description: '', dueDate: '' });
  };

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingId) return;
    resetStatus();

    if (!editForm.title.trim() || !editForm.dueDate) {
      setError('Title and due date are required.');
      return;
    }

    setSavingId(editingId);
    try {
      const res = await fetch(`/api/tasks/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          dueDate: new Date(editForm.dueDate).toISOString(),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update task');
      }

      const data = await res.json();
      if (data.task) {
        applyUpdate(data.task);
        setMessage('Task updated');
      }
      cancelEdit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update task';
      setError(msg);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (task: Task) => {
    if (!task.id) return;
    resetStatus();
    setDeletingId(task.id);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to delete task');
      }
      setTasks((prev) => prev.filter((t) => !(t.id && task.id && t.id === task.id)));
      setMessage('Task deleted');
      if (editingId === task.id) {
        cancelEdit();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete task';
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-zinc-50 text-slate-900">
      <main className="mx-auto max-w-5xl px-6 py-16">
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tasks</p>
            <h1 className="text-4xl font-semibold tracking-tight">Task dashboard</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Create, update, and delete tasks using the controls below. All actions hit <span className="font-semibold text-slate-900">/api/tasks</span>.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm">
            {taskCount} total
          </div>
        </header>

        <section className="mt-8 grid gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Create</p>
                <h2 className="text-xl font-semibold text-slate-900">Add a new task</h2>
              </div>
            </div>

            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={handleCreate}>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-800 sm:col-span-1">
                Title
                <input
                  required
                  name="title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-slate-300 focus:bg-white"
                  placeholder="Write a title"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-800 sm:col-span-1">
                Due date
                <input
                  required
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-slate-300 focus:bg-white"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-800 sm:col-span-2">
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-slate-300 focus:bg-white"
                  placeholder="Add more context (optional)"
                />
              </label>

              <div className="flex items-center justify-end gap-3 sm:col-span-2">
                {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
                {message && !error ? <p className="text-sm font-medium text-emerald-600">{message}</p> : null}
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Creating…' : 'Create task'}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-8 py-12 text-center shadow-sm">
                <p className="text-lg font-semibold text-slate-800">No tasks yet</p>
                <p className="mt-2 text-sm text-slate-600">
                  Use the form above to create your first task.
                </p>
              </div>
            ) : (
              <ul className="grid gap-4">
                {tasks.map((task, index) => {
                  const key = task.id ?? `task-${index}`;
                  const date = task.dueDate ? new Date(task.dueDate) : null;
                  const isOverdue = date ? date < new Date() && !task.completed : false;
                  const isEditing = editingId === task.id;

                  return (
                    <li
                      key={key}
                      className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            {task.id ? `#${task.id}` : 'Task'}
                          </p>
                          <h2 className="text-xl font-semibold text-slate-900">
                            {task.title || 'Untitled task'}
                          </h2>
                          {task.description ? (
                            <p className="text-sm leading-relaxed text-slate-600">{task.description}</p>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                            <span
                              className={`rounded-full border px-3 py-1 font-medium ${
                                task.completed
                                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                  : 'border-amber-100 bg-amber-50 text-amber-700'
                              }`}
                            >
                              {task.completed ? 'Completed' : 'Open'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={isOverdue ? 'font-semibold text-rose-600' : 'text-slate-700'}>
                                {formatDueDate(task.dueDate)}
                              </span>
                              {isOverdue ? <span className="text-xs font-semibold text-rose-500">Overdue</span> : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-2 text-sm sm:items-end">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleToggleComplete(task)}
                              disabled={savingId === task.id}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:opacity-60"
                            >
                              {savingId === task.id
                                ? 'Saving…'
                                : task.completed
                                ? 'Mark open'
                                : 'Mark complete'}
                            </button>
                            <button
                              onClick={() => startEdit(task)}
                              disabled={!task.id || deletingId === task.id}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:opacity-60"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(task)}
                              disabled={!task.id || deletingId === task.id}
                              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 font-semibold text-rose-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:opacity-60"
                            >
                              {deletingId === task.id ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {isEditing ? (
                        <form className="mt-4 grid gap-4 rounded-xl bg-slate-50/60 p-4 sm:grid-cols-2" onSubmit={submitEdit}>
                          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 sm:col-span-1">
                            Title
                            <input
                              required
                              value={editForm.title}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-slate-300"
                            />
                          </label>
                          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 sm:col-span-1">
                            Due date
                            <input
                              required
                              type="date"
                              value={editForm.dueDate}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-slate-300"
                            />
                          </label>
                          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 sm:col-span-2">
                            Description
                            <textarea
                              value={editForm.description}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                              className="min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-slate-300"
                            />
                          </label>
                          <div className="flex items-center justify-end gap-3 sm:col-span-2">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={savingId === task.id}
                              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:opacity-60"
                            >
                              {savingId === task.id ? 'Saving…' : 'Save changes'}
                            </button>
                          </div>
                        </form>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
