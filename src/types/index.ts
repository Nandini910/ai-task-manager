export type TaskStatus = "pending" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
    id: number;
    title: string;
    status: TaskStatus;
    priority: TaskPriority | null;
    due_date: string | null;
    created_at: string;
    sort_order: number | null;
}