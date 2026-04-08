interface Props {
    value: string;
    onChange: (val: string) => void;
}

export default function TaskSearch({ value, onChange }: Props) {
    return (
        <div className="mb-4">
            <label htmlFor="task-search" className="sr-only">Search tasks</label>
            <input
                id="task-search"
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search tasks…"
                autoComplete="off"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none ring-sky-300 transition placeholder:text-slate-400 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
        </div>
    );
}