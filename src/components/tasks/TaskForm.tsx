"use client";
import { useState } from "react";
import type { TaskPriority } from "@/types";
import {GeminiIcon} from "@/app/icons/svg";

interface Props {
    onAdd: (title: string, priority: TaskPriority, dueDate: string) => Promise<boolean>;
}

export default function TaskForm({ onAdd }: Props) {
    const [title, setTitle] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("medium");
    const [dueDate, setDueDate] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleAISuggest = async () => {
        if (!title) return;
        try {
            const res = await fetch("/api/suggest-priority", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title }),
            });
            const data = await res.json();
            if (data.priority) setPriority(data.priority.toLowerCase() as TaskPriority);
        } catch {
            setPriority("medium");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSubmitting(true);
        const success = await onAdd(title, priority, dueDate);
        if (success) {
            setTitle("");
            setPriority("medium");
            setDueDate("");
        }
        setSubmitting(false);
    };

    return (
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Task List</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Track your tasks with Supabase-backed persistence.
                </p>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-12">
                <div className="relative sm:col-span-6">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Add a new task..."
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 pr-10 py-2.5 text-slate-900 outline-none ring-sky-300 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <button type="button" onClick={handleAISuggest}><GeminiIcon/></button>
                    </div>
                </div>
                <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}
                        className="sm:col-span-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none ring-sky-300 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                       className="sm:col-span-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none ring-sky-300 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:[color-scheme:dark]"
                />
                <button type="submit" disabled={submitting}
                        className="sm:col-span-12 rounded-xl bg-sky-600 px-4 py-2.5 font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sky-500 dark:hover:bg-sky-400">
                    {submitting ? "Adding..." : "Add Task"}
                </button>
            </form>
        </section>
    );
}