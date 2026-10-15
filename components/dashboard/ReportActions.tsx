"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ReportActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  async function set(next: string) {
    const { error: err } = await supabase.from("reports").update({ status: next }).eq("id", id);
    if (err) return setError(err.message);
    router.refresh();
  }

  if (status !== "open") return <span className="text-[12.5px] text-ink-soft">{status === "reviewed" ? "Traité" : "Classé"}</span>;
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => set("reviewed")} className="rounded-[8px] border border-line px-2.5 py-1 text-[12.5px] font-medium hover:bg-bg-soft">Marquer traité</button>
      <button onClick={() => set("dismissed")} className="rounded-[8px] border border-line px-2.5 py-1 text-[12.5px] font-medium text-ink-soft hover:bg-bg-soft">Classer sans suite</button>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
