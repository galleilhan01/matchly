"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function AcceptApplicationButton({
  applicationId,
  campaignId,
  creatorId,
  brandId,
}: {
  applicationId: string;
  campaignId: string;
  creatorId: string;
  brandId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setError(null);
    setLoading(true);
    try {
      const { error: appError } = await supabase
        .from("applications")
        .update({ status: "accepted" })
        .eq("id", applicationId);
      if (appError) throw appError;

      const { error: missionError } = await supabase.from("missions").insert({
        application_id: applicationId,
        campaign_id: campaignId,
        creator_id: creatorId,
        brand_id: brandId,
        status: "accepted",
      });
      if (missionError) throw missionError;

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'acceptation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button type="button" onClick={handleAccept} loading={loading} className="text-[13.5px]">
        Sélectionner
      </Button>
      {error && <p className="error-text mt-1.5 max-w-[180px] text-right">{error}</p>}
    </div>
  );
}
