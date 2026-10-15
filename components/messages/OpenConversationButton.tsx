"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Ouvre (ou crée) la conversation entre une marque et un créateur, puis redirige vers la messagerie. */
export function OpenConversationButton({
  brandId,
  creatorId,
  campaignId,
  role,
  label = "💬 Envoyer un message",
}: {
  brandId: string;
  creatorId: string;
  campaignId?: string | null;
  role: "brand" | "creator";
  label?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setLoading(true);
    setError(null);
    let query = supabase.from("conversations").select("id").eq("brand_id", brandId).eq("creator_id", creatorId);
    query = campaignId ? query.eq("campaign_id", campaignId) : query.is("campaign_id", null);
    const { data: existing } = await query.maybeSingle();

    let id = existing?.id as string | undefined;
    if (!id) {
      const { data, error: err } = await supabase
        .from("conversations")
        .insert({ brand_id: brandId, creator_id: creatorId, campaign_id: campaignId ?? null })
        .select("id")
        .single();
      if (err) {
        setLoading(false);
        return setError(err.message);
      }
      id = data.id;
    }
    router.push(`/dashboard/${role}/messages?c=${id}`);
  }

  return (
    <div>
      <button type="button" onClick={open} disabled={loading} className="btn-ghost">
        {loading ? "Ouverture…" : label}
      </button>
      {error && <p className="error-text mt-1">{error}</p>}
    </div>
  );
}
