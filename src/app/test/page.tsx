"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type TaskRow = {
  id?: string | number;
  [key: string]: unknown;
};

export default function TestPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      const { data, error: fetchError } = await supabase.from("tasks").select("*");

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setTasks(data ?? []);
      }

      setLoading(false);
    }

    fetchTasks();
  }, []);

  return (
    <main style={{ padding: "1.5rem" }}>
      <h1>Tasks Test Page</h1>

      {loading && <p>Loading tasks...</p>}
      {!loading && error && <p>Error: {error}</p>}

      {!loading && !error && (
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(tasks, null, 2)}</pre>
      )}
    </main>
  );
}

