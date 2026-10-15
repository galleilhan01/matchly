"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ReportButton({ reporterId, reportedProfileId, campaignId }: { reporterId: string; reportedProfileId?: string; campaignId?: string }) {
  const supabase = createClient();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function report() {
    const reason = prompt("Pourquoi signalez-vous ce contenu ? (obligatoire)");
    if (!reason || reason.trim().length < 5) return;
    setError(null);
    const { error: err } = await supabase.from("reports").insert({
      reporter_id: reporterId,
      reported_profile_id: reportedProfileId ?? null,
      campaign_id: campaignId ?? null,
      reason: reason.trim(),
    });
    if (err) return setError(err.message);
    setSent(true);
  }

  if (sent) return <p className="text-[13px] text-ink-soft">Signalement envoyé, merci.</p>;
  return (
    <div>
      <button type="button" onClick={report} className="text-[13px] font-medium text-ink-soft hover:text-red-600">
        ⚑ Signaler
      </button>
      {error && <p className="error-text mt-1">{error}</p>}
    </div>
  );
}
