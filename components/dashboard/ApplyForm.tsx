"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { AiButton } from "@/components/ai/AiButton";

export function ApplyForm({
  campaignId,
  userId,
  aiContext,
}: {
  campaignId: string;
  userId: string;
  aiContext: unknown;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    const { error: insertError } = await supabase.from("applications").insert({
      campaign_id: campaignId,
      creator_id: userId,
      message: message.trim() || null,
    });
    setLoading(false);
    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "Vous avez déjà postulé à cette campagne."
          : "Impossible d'envoyer votre candidature : " + insertError.message
      );
      return;
    }
    router.refresh();
  }

  return (
    <div className="card">
      <p className="mb-1 text-[15px] font-semibold text-ink">Postuler à cette campagne</p>
      <p className="mb-4 text-[13px] text-ink-soft">Présentez-vous en quelques lignes : pourquoi cette campagne vous correspond.</p>
      <textarea
        className="input min-h-[120px] resize-none"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={1000}
        placeholder="Bonjour, j'aime beaucoup votre marque car…"
      />
      {error && <p className="error-text mt-2">{error}</p>}
      <div className="mt-4 flex flex-wrap items-start gap-3">
        <Button type="button" onClick={submit} loading={loading}>
          Postuler
        </Button>
        <AiButton
          task="improve_application"
          context={{ ...(aiContext as object), draft: message }}
          label="✨ Améliorer avec l'IA"
          onResult={(text) => setMessage(text)}
        />
      </div>
    </div>
  );
}
