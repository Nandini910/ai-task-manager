"use client";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableTaskRow from "./SortableTaskRow";
import TaskCard from "./TaskCard";
import type { Task } from "@/types";

interface Props {
    tasks: Task[];
    filteredTasks: Task[];
    loading: boolean;
    searchIsActive: boolean;
    sortableIds: string[];
    sensors: any;
    onToggleComplete: (task: Task) => void;
    onDelete: (id: number) => void;
    onDragEnd: (event: DragEndEvent) => void;
}

export default function TaskList({
                                     tasks, filteredTasks, loading, searchIsActive,
                                     sortableIds, sensors, onToggleComplete, onDelete, onDragEnd,
                                 }: Props) {
    if (loading) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                Loading tasks...
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 dark:border-slate-600 dark:bg-slate-900">
                No tasks yet. Add your first task above.
            </div>
        );
    }

    if (filteredTasks.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 dark:border-slate-600 dark:bg-slate-900">
                No tasks match your search.
            </div>
        );
    }

    if (searchIsActive) {
        return (
            <div className="space-y-3">
                {filteredTasks.map((task) => (
                    <TaskCard key={task.id} task={task}
                              onToggleComplete={() => onToggleComplete(task)}
                              onDelete={() => onDelete(task.id)}
                    />
                ))}
            </div>
        );
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                    {filteredTasks.map((task) => (
                        <SortableTaskRow key={task.id} task={task}
                                         isCompleted={task.status === "completed"}
                                         onToggleComplete={() => onToggleComplete(task)}
                                         onDelete={() => onDelete(task.id)}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}