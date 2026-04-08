import type { Task } from "@/types";

export function sortTasksForDisplay(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
        if (a.status === "completed" && b.status !== "completed") return 1;
        if (a.status !== "completed" && b.status === "completed") return -1;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
}

export function celebrateTaskComplete() {
    void import("canvas-confetti").then((mod) => {
        const confetti = mod.default;
        const base = { origin: { y: 0.72 }, zIndex: 9999 };
        confetti({ ...base, particleCount: 110, spread: 72, startVelocity: 42 });
        setTimeout(() => {
            confetti({ ...base, particleCount: 65, spread: 100, startVelocity: 32, ticks: 90, scalar: 0.9 });
        }, 140);
    });
}