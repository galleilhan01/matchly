"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { AiButton } from "@/components/ai/AiButton";

export function ContactCreatorPanel({
  brandId,
  creatorId,
  campaignId,
  aiContext,
}: {
  brandId: string;
  creatorId: string;
  campaignId?: string | null;
  aiContext: unknown;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!message.trim()) return setError("Écrivez un message.");
    setLoading(true);
    setError(null);

    let query = supabase.from("conversations").select("id").eq("brand_id", brandId).eq("creator_id", creatorId);
    query = campaignId ? query.eq("campaign_id", campaignId) : query.is("campaign_id", null);
    const { data: existing } = await query.maybeSingle();

    let conversationId = existing?.id as string | undefined;
    if (!conversationId) {
      const { data, error: convErr } = await supabase
        .from("conversations")
        .insert({ brand_id: brandId, creator_id: creatorId, campaign_id: campaignId ?? null })
        .select("id")
        .single();
      if (convErr) {
        setLoading(false);
        return setError(convErr.message);
      }
      conversationId = data.id;
    }

    const { error: msgErr } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: brandId, content: message.trim() });
    setLoading(false);
    if (msgErr) return setError(msgErr.message);
    router.push(`/dashboard/brand/messages?c=${conversationId}`);
  }

  return (
    <div className="card mb-6">
      <p className="mb-3 text-[14.5px] font-semibold text-ink">Contacter ce créateur</p>
      <textarea className="input min-h-[100px] resize-none" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Bonjour, nous aimerions collaborer avec vous sur…" />
      {error && <p className="error-text mt-2">{error}</p>}
      <div className="mt-3 flex flex-wrap items-start gap-3">
        <Button type="button" onClick={send} loading={loading}>
          Envoyer le message
        </Button>
        <AiButton task="contact_message" context={aiContext} label="✨ Générer un message" onResult={(text) => setMessage(text)} />
      </div>
    </div>
  );
}
