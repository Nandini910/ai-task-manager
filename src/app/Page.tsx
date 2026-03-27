"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type TaskStatus = "pending" | "completed";
type TaskPriority = "low" | "medium" | "high";

type Task = {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority | null;
  due_date: string | null;
  created_at: string | null;
};

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      total: tasks.length,
      completed: tasks.filter((task) => task.status === "completed").length,
    }),
    [tasks],
  );

  async function fetchTasks(options?: { showLoading?: boolean }) {
    if (options?.showLoading) {
      setLoading(true);
    }
    const { data, error: fetchError } = await supabase
      .from("tasks")
      .select("id,title,status,priority,due_date,created_at")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setTasks((data ?? []) as Task[]);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    const loadInitialTasks = async () => {
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("id,title,status,priority,due_date,created_at")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setTasks((data ?? []) as Task[]);
        setError(null);
      }
      setLoading(false);
    };

    loadInitialTasks();
  }, []);

  async function handleAddTask(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }

    setSubmitting(true);
    const { error: insertError } = await supabase.from("tasks").insert({
      title: title.trim(),
      status: "pending",
      priority,
      due_date: dueDate || null,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setTitle("");
      setPriority("medium");
      setDueDate("");
      setError(null);
      await fetchTasks({ showLoading: false });
    }
    setSubmitting(false);
  }

  async function toggleTaskComplete(task: Task) {
    const nextStatus: TaskStatus = task.status === "completed" ? "pending" : "completed";
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ status: nextStatus })
      .eq("id", task.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id ? { ...currentTask, status: nextStatus } : currentTask,
      ),
    );
    setError(null);
  }

  async function deleteTask(taskId: number) {
    const { error: deleteError } = await supabase.from("tasks").delete().eq("id", taskId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
    setError(null);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Task List</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track your tasks with Supabase-backed persistence.
            </p>
          </div>
          <div className="rounded-xl bg-slate-100 px-4 py-2 text-right text-sm text-slate-700">
            <p>Total: {counts.total}</p>
            <p>Done: {counts.completed}</p>
          </div>
        </div>

        <form onSubmit={handleAddTask} className="grid gap-3 sm:grid-cols-12">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add a new task..."
            className="sm:col-span-6 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none ring-sky-300 transition focus:ring-2"
          />
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            className="sm:col-span-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none ring-sky-300 transition focus:ring-2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="sm:col-span-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none ring-sky-300 transition focus:ring-2"
          />
          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-12 rounded-xl bg-sky-600 px-4 py-2.5 font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Adding..." : "Add Task"}
          </button>
        </form>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-500 shadow-sm">
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            No tasks yet. Add your first task above.
          </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = task.status === "completed";
            return (
              <article
                key={task.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <h2
                    className={`truncate text-base font-medium ${
                      isCompleted ? "text-slate-400 line-through" : "text-slate-900"
                    }`}
                  >
                    {task.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Priority: {task.priority ?? "n/a"} | Due: {task.due_date ?? "n/a"}
                  </p>
                </div>

                <div className="ml-4 flex items-center gap-2">
                  <button
                    onClick={() => toggleTaskComplete(task)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      isCompleted
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                  >
                    {isCompleted ? "Undo" : "Complete"}
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="rounded-lg bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-200"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}