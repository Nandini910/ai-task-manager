"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type TaskStatus = "pending" | "completed";
type TaskPriority = "low" | "medium" | "high";

/** Persisted order; add with: `alter table tasks add column if not exists sort_order int;` */
type Task = {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority | null;
  due_date: string | null;
  created_at: string | null;
  sort_order: number | null;
};

function compareTasksForDisplay(a: Task, b: Task) {
  const ao = a.sort_order;
  const bo = b.sort_order;
  if (ao != null && bo != null && ao !== bo) {
    return ao - bo;
  }
  if (ao != null && bo == null) {
    return -1;
  }
  if (ao == null && bo != null) {
    return 1;
  }
  const at = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
  return bt - at;
}

function sortTasksForDisplay(list: Task[]): Task[] {
  return [...list].sort(compareTasksForDisplay);
}

const SEARCH_DEBOUNCE_MS = 300;

type SortableTaskRowProps = {
  task: Task;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onDelete: () => void;
};

function SortableTaskRow({ task, isCompleted, onToggleComplete, onDelete }: SortableTaskRowProps) {
  const rowId = String(task.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${
        isDragging ? "z-10 cursor-grabbing opacity-95 shadow-lg ring-2 ring-sky-400/60 dark:ring-sky-500/50" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none rounded-lg p-2 text-slate-400 outline-none hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing dark:hover:bg-slate-800 dark:hover:text-slate-300"
          aria-label={`Drag to reorder: ${task.title}`}
          {...attributes}
          {...listeners}
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <circle cx="6" cy="5" r="1.5" />
            <circle cx="14" cy="5" r="1.5" />
            <circle cx="6" cy="10" r="1.5" />
            <circle cx="14" cy="10" r="1.5" />
            <circle cx="6" cy="15" r="1.5" />
            <circle cx="14" cy="15" r="1.5" />
          </svg>
        </button>
        <div className="min-w-0">
          <h2
            className={`truncate text-base font-medium ${
              isCompleted
                ? "text-slate-400 line-through dark:text-slate-500"
                : "text-slate-900 dark:text-slate-100"
            }`}
          >
            {task.title}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Priority: {task.priority ?? "n/a"} | Due: {task.due_date ?? "n/a"}
          </p>
        </div>
      </div>

      <div className="ml-2 flex shrink-0 items-center gap-2 sm:ml-4">
        <button
          type="button"
          onClick={onToggleComplete}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            isCompleted
              ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60"
              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
          }`}
        >
          {isCompleted ? "Undo" : "Complete"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950/70"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function celebrateTaskComplete() {
  void import("canvas-confetti").then((mod) => {
    const confetti = mod.default;
    const base = { origin: { y: 0.72 }, zIndex: 9999 };
    confetti({
      ...base,
      particleCount: 110,
      spread: 72,
      startVelocity: 42,
    });
    setTimeout(() => {
      confetti({
        ...base,
        particleCount: 65,
        spread: 100,
        startVelocity: 32,
        ticks: 90,
        scalar: 0.9,
      });
    }, 140);
  });
}

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortableIds = useMemo(() => tasks.map((task) => String(task.id)), [tasks]);

  const counts = useMemo(
    () => ({
      total: tasks.length,
      completed: tasks.filter((task) => task.status === "completed").length,
    }),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) {
      return tasks;
    }
    return tasks.filter((task) => {
      if (task.title.toLowerCase().includes(q)) {
        return true;
      }
      if (task.priority?.toLowerCase().includes(q)) {
        return true;
      }
      if (task.status.toLowerCase().includes(q)) {
        return true;
      }
      if (task.due_date?.toLowerCase().includes(q)) {
        return true;
      }
      return false;
    });
  }, [tasks, debouncedSearch]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timerId);
  }, [searchQuery]);

  async function fetchTasks(options?: { showLoading?: boolean }) {
    if (options?.showLoading) {
      setLoading(true);
    }
    const { data, error: fetchError } = await supabase
      .from("tasks")
      .select("id,title,status,priority,due_date,created_at,sort_order");

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setTasks(sortTasksForDisplay((data ?? []) as Task[]));
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    const loadInitialTasks = async () => {
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("id,title,status,priority,due_date,created_at,sort_order");

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setTasks(sortTasksForDisplay((data ?? []) as Task[]));
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
    const maxOrder = tasks.reduce((max, task) => Math.max(max, task.sort_order ?? -1), -1);
    const { error: insertError } = await supabase.from("tasks").insert({
      title: title.trim(),
      status: "pending",
      priority,
      due_date: dueDate || null,
      sort_order: maxOrder + 1,
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

    if (nextStatus === "completed") {
      celebrateTaskComplete();
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

  async function persistSortOrder(ordered: Task[]) {
    const results = await Promise.all(
      ordered.map((task, index) =>
        supabase.from("tasks").update({ sort_order: index }).eq("id", task.id),
      ),
    );
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setError(failed.error.message);
      await fetchTasks({ showLoading: false });
      return;
    }
    setError(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setTasks((items) => {
      const oldIndex = items.findIndex((task) => String(task.id) === active.id);
      const newIndex = items.findIndex((task) => String(task.id) === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        return items;
      }
      const reordered = arrayMove(items, oldIndex, newIndex).map((task, index) => ({
        ...task,
        sort_order: index,
      }));
      void persistSortOrder(reordered);
      return reordered;
    });
  }

  const searchIsActive = debouncedSearch.trim().length > 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-4 flex justify-end">
        <ThemeToggle />
      </div>

      <div
        className="mb-6 rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-sky-100/80 px-4 py-3 text-center text-sm font-medium text-sky-950 shadow-sm dark:border-sky-800 dark:from-sky-950 dark:to-sky-900/90 dark:text-sky-100"
        role="status"
        aria-live="polite"
      >
        {loading ? (
          <span className="text-sky-800/80 dark:text-sky-200/80">Loading task progress…</span>
        ) : (
          <>
            {counts.completed} of {counts.total} task{counts.total === 1 ? "" : "s"} completed
          </>
        )}
      </div>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Task List</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track your tasks with Supabase-backed persistence.
          </p>
        </div>

        <form onSubmit={handleAddTask} className="grid gap-3 sm:grid-cols-12">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add a new task..."
            className="sm:col-span-6 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none ring-sky-300 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-sky-600 dark:focus:ring-sky-500"
          />
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            className="sm:col-span-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none ring-sky-300 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-sky-600 dark:focus:ring-sky-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="sm:col-span-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none ring-sky-300 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-sky-600 dark:[color-scheme:dark]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-12 rounded-xl bg-sky-600 px-4 py-2.5 font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            {submitting ? "Adding..." : "Add Task"}
          </button>
        </form>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="task-search" className="sr-only">
          Search tasks
        </label>
        <input
          id="task-search"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search tasks…"
          autoComplete="off"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none ring-sky-300 transition placeholder:text-slate-400 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:ring-sky-600 dark:focus:ring-sky-500"
        />
      </div>

      {!loading && tasks.length > 0 && (
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          {searchIsActive
            ? "Clear search to drag and reorder tasks."
            : "Drag the grip on the left to reorder tasks."}
        </p>
      )}

      <section className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400">
            No tasks yet. Add your first task above.
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400">
            No tasks match your search.
          </div>
        ) : searchIsActive ? (
          filteredTasks.map((task) => {
            const isCompleted = task.status === "completed";
            return (
              <article
                key={task.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="min-w-0">
                  <h2
                    className={`truncate text-base font-medium ${
                      isCompleted
                        ? "text-slate-400 line-through dark:text-slate-500"
                        : "text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {task.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Priority: {task.priority ?? "n/a"} | Due: {task.due_date ?? "n/a"}
                  </p>
                </div>

                <div className="ml-4 flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleTaskComplete(task)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      isCompleted
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                    }`}
                  >
                    {isCompleted ? "Undo" : "Complete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="rounded-lg bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950/70"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {filteredTasks.map((task) => (
                <SortableTaskRow
                  key={task.id}
                  task={task}
                  isCompleted={task.status === "completed"}
                  onToggleComplete={() => toggleTaskComplete(task)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </section>
    </main>
  );
}