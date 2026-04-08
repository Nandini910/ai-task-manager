"use client";
import { useMemo, useState, useEffect } from "react";
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useTasks } from "@/hooks/useTasks";
import TaskForm from "@/components/tasks/TaskForm";
import TaskSearch from "@/components/tasks/TaskSearch";
import TaskList from "@/components/tasks/TaskList";
import DailyBriefing from "@/components/tasks/DailyBriefing";
import {ThemeToggle} from "@/components/theme-toggle";

const SEARCH_DEBOUNCE_MS = 300;

export default function TaskListPage() {
    const { tasks, loading, error, addTask, toggleTaskComplete, deleteTask, handleDragEnd } = useTasks();
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        const id = window.setTimeout(() => setDebouncedSearch(searchQuery), SEARCH_DEBOUNCE_MS);
        return () => window.clearTimeout(id);
    }, [searchQuery]);

    const counts = useMemo(() => ({
        total: tasks.length,
        completed: tasks.filter((t) => t.status === "completed").length,
    }), [tasks]);

    const filteredTasks = useMemo(() => {
        const q = debouncedSearch.trim().toLowerCase();
        if (!q) return tasks;
        return tasks.filter((t) =>
            t.title.toLowerCase().includes(q) ||
            t.priority?.toLowerCase().includes(q) ||
            t.status.toLowerCase().includes(q) ||
            t.due_date?.toLowerCase().includes(q)
        );
    }, [tasks, debouncedSearch]);

    const sortableIds = useMemo(() => tasks.map((t) => String(t.id)), [tasks]);
    const searchIsActive = debouncedSearch.trim().length > 0;

    return (
        <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-4 flex justify-end"><ThemeToggle /></div>

            <div className="mb-6 rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-sky-100/80 px-4 py-3 text-center text-sm font-medium text-sky-950 shadow-sm dark:border-sky-800 dark:from-sky-950 dark:to-sky-900/90 dark:text-sky-100"
                 role="status" aria-live="polite">
                {loading ? (
                    <span className="text-sky-800/80 dark:text-sky-200/80">Loading task progress…</span>
                ) : (
                    <>{counts.completed} of {counts.total} task{counts.total === 1 ? "" : "s"} completed</>
                )}
            </div>

            <TaskForm onAdd={addTask} />

            {error && (
                <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                    {error}
                </div>
            )}

            <TaskSearch value={searchQuery} onChange={setSearchQuery} />

            {!loading && tasks.length > 0 && (
                <DailyBriefing tasks={tasks} disabled={loading} />
            )}

            <section className="space-y-3">
                <TaskList
                    tasks={tasks}
                    filteredTasks={filteredTasks}
                    loading={loading}
                    searchIsActive={searchIsActive}
                    sortableIds={sortableIds}
                    sensors={sensors}
                    onToggleComplete={toggleTaskComplete}
                    onDelete={deleteTask}
                    onDragEnd={handleDragEnd}
                />
            </section>
        </main>
    );
}