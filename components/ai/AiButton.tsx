"use client";

import { useState } from "react";

export function AiButton({
  task,
  context,
  label,
  onResult,
  className = "btn-ghost",
}: {
  task: string;
  context: unknown;
  label: string;
  onResult: (text: string, task: string) => void;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "L'IA n'a pas pu répondre.");
      onResult(data.text, task);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur IA.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col">
      <button type="button" onClick={run} disabled={loading} className={`${className} text-[13.5px] !px-3.5 !py-2`}>
        {loading ? "Génération…" : label}
      </button>
      {error && <span className="error-text mt-1 max-w-[260px]">{error}</span>}
    </div>
  );
}
