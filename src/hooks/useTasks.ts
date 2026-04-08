import { useState, useEffect } from "react";
import { sortTasksForDisplay, celebrateTaskComplete } from "@/utils/helpers";
import type { Task, TaskStatus, TaskPriority } from "@/types";
import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";
import {supabase} from "../../lib/supabase";

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchTasks(options?: { showLoading?: boolean }) {
        if (options?.showLoading) setLoading(true);
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
        fetchTasks({ showLoading: true });
    }, []);

    async function addTask(title: string, priority: TaskPriority, dueDate: string) {
        const maxOrder = tasks.reduce((max, t) => Math.max(max, t.sort_order ?? -1), -1);
        const { error: insertError } = await supabase.from("tasks").insert({
            title: title.trim(),
            status: "pending",
            priority,
            due_date: dueDate || null,
            sort_order: maxOrder + 1,
        });

        if (insertError) {
            setError(insertError.message);
            return false;
        }
        setError(null);
        await fetchTasks({ showLoading: false });
        return true;
    }

    async function toggleTaskComplete(task: Task) {
        const nextStatus: TaskStatus = task.status === "completed" ? "pending" : "completed";
        const { error: updateError } = await supabase
            .from("tasks")
            .update({ status: nextStatus })
            .eq("id", task.id);

        if (updateError) { setError(updateError.message); return; }
        if (nextStatus === "completed") celebrateTaskComplete();

        setTasks((current) =>
            current.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
        );
        setError(null);
    }

    async function deleteTask(taskId: number) {
        const { error: deleteError } = await supabase.from("tasks").delete().eq("id", taskId);
        if (deleteError) { setError(deleteError.message); return; }
        setTasks((current) => current.filter((t) => t.id !== taskId));
        setError(null);
    }

    async function persistSortOrder(ordered: Task[]) {
        const results = await Promise.all(
            ordered.map((task, index) =>
                supabase.from("tasks").update({ sort_order: index }).eq("id", task.id)
            )
        );
        const failed = results.find((r) => r.error);
        if (failed?.error) {
            setError(failed.error.message);
            await fetchTasks({ showLoading: false });
            return;
        }
        setError(null);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setTasks((items) => {
            const oldIndex = items.findIndex((t) => String(t.id) === active.id);
            const newIndex = items.findIndex((t) => String(t.id) === over.id);
            if (oldIndex < 0 || newIndex < 0) return items;
            const reordered = arrayMove(items, oldIndex, newIndex).map((t, i) => ({
                ...t,
                sort_order: i,
            }));
            void persistSortOrder(reordered);
            return reordered;
        });
    }

    return {
        tasks, loading, error,
        addTask, toggleTaskComplete, deleteTask, handleDragEnd,
    };
}