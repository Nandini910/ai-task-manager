import type { Task } from "@/types";

interface Props {
    task: Task;
    onToggleComplete: () => void;
    onDelete: () => void;
}

export default function TaskCard({ task, onToggleComplete, onDelete }: Props) {
    const isCompleted = task.status === "completed";
    return (
        <article className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
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
            <div className="ml-4 flex shrink-0 items-center gap-2">
                <button type="button" onClick={onToggleComplete}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                            isCompleted
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300"
                        }`}>
                    {isCompleted ? "Undo" : "Complete"}
                </button>
                <button type="button" onClick={onDelete}
                        className="rounded-lg bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-200 dark:bg-rose-950/50 dark:text-rose-300">
                    Delete
                </button>
            </div>
        </article>
    );
}