"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types";

interface Props {
    task: Task;
    isCompleted: boolean;
    onToggleComplete: () => void;
    onDelete: () => void;
}

export default function SortableTaskRow({ task, isCompleted, onToggleComplete, onDelete }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: String(task.id),
    });

    return (
        <article
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
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
                        <circle cx="6" cy="5" r="1.5"/><circle cx="14" cy="5" r="1.5"/>
                        <circle cx="6" cy="10" r="1.5"/><circle cx="14" cy="10" r="1.5"/>
                        <circle cx="6" cy="15" r="1.5"/><circle cx="14" cy="15" r="1.5"/>
                    </svg>
                </button>
                <div className="min-w-0">
                    <h2 className={`truncate text-base font-medium ${
                        isCompleted ? "text-slate-400 line-through dark:text-slate-500" : "text-slate-900 dark:text-slate-100"
                    }`}>
                        {task.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Priority: {task.priority ?? "n/a"} | Due: {task.due_date ?? "n/a"}
                    </p>
                </div>
            </div>
            <div className="ml-2 flex shrink-0 items-center gap-2 sm:ml-4">
                <button type="button" onClick={onToggleComplete}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                            isCompleted
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300"
                        }`}>
                    {isCompleted ? "Undo" : "Complete"}
                </button>
                <button type="button" onClick={onDelete}
                        className="rounded-lg bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-200 dark:bg-rose-950/50 dark:text-rose-300">
                    Delete
                </button>
            </div>
        </article>
    );
}