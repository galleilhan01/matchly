"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminCampaignActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  async function setStatus(next: string) {
    if (!confirm(next === "archived" ? "Archiver cette campagne ? Elle ne sera plus visible des créateurs." : "Republier cette campagne ?")) return;
    const { error: err } = await supabase.from("campaigns").update({ status: next }).eq("id", id);
    if (err) return setError(err.message);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {status === "archived" ? (
        <button onClick={() => setStatus("published")} className="rounded-[8px] border border-line px-2.5 py-1 text-[12.5px] font-medium hover:bg-bg-soft">Republier</button>
      ) : (
        <button onClick={() => setStatus("archived")} className="rounded-[8px] border border-red-200 px-2.5 py-1 text-[12.5px] font-medium text-red-600 hover:bg-bg-soft">Archiver</button>
      )}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
