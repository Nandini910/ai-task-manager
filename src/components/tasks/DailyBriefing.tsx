"use client";
import { useState } from "react";
import type { Task } from "@/types";

interface Props {
    tasks: Task[];
    disabled?: boolean;
}

export default function DailyBriefing({ tasks, disabled }: Props) {
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);

    const handleDailyBriefing = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/summarize-day", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tasks }),
            });
            const data = await res.json();
            setSummary(data.summary);
        } catch (e) {
            console.error("Error summarizing:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Drag the grip on the left to reorder tasks.
                </p>
                <button type="button" disabled={disabled || loading} onClick={handleDailyBriefing}
                        className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-sky-700 disabled:opacity-70 dark:bg-sky-500 flex items-center gap-2 shadow-sm active:scale-95">
                    {loading ? <><span className="animate-spin">⏳</span>Analyzing...</> : "✨ Summarize my day"}
                </button>
            </div>

            {(loading || summary) && (
                <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5 dark:border-sky-900/30 dark:bg-sky-900/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sky-500">🪄</span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">Daily Insight</h3>
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            <div className="h-3 bg-sky-200/50 rounded-full w-full animate-pulse dark:bg-sky-800/50"/>
                            <div className="h-3 bg-sky-200/50 rounded-full w-4/5 animate-pulse dark:bg-sky-800/50"/>
                            <div className="h-3 bg-sky-200/50 rounded-full w-2/3 animate-pulse dark:bg-sky-800/50"/>
                        </div>
                    ) : (
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 italic">{summary}</p>
                    )}
                </div>
            )}
        </div>
    );
}