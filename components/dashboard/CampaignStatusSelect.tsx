"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const OPTIONS = [
  { value: "draft", label: "Brouillon" },
  { value: "published", label: "Publiée" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminée" },
  { value: "archived", label: "Archivée" },
];

export function CampaignStatusSelect({ campaignId, status }: { campaignId: string; status: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);

  async function change(next: string) {
    const previous = value;
    setValue(next);
    setError(null);
    const { error: err } = await supabase.from("campaigns").update({ status: next, updated_at: new Date().toISOString() }).eq("id", campaignId);
    if (err) {
      setValue(previous);
      return setError(err.message);
    }
    router.refresh();
  }

  return (
    <div>
      <label className="mb-1 block text-[12px] text-ink-soft">Statut</label>
      <select className="input !w-auto !py-2 text-[14px]" value={value} onChange={(e) => change(e.target.value)}>
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="error-text mt-1">{error}</p>}
    </div>
  );
}
