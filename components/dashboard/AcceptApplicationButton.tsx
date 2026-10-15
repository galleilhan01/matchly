"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function AcceptApplicationButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setError(null);
    setBusy("accept");
    const { error: err } = await supabase.rpc("accept_application", { p_application_id: applicationId });
    setBusy(null);
    if (err) return setError(err.message);
    router.refresh();
  }

  async function reject() {
    if (!confirm("Refuser cette candidature ?")) return;
    setError(null);
    setBusy("reject");
    const { error: err } = await supabase.from("applications").update({ status: "rejected" }).eq("id", applicationId);
    setBusy(null);
    if (err) return setError(err.message);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={reject} loading={busy === "reject"} className="!px-3.5 !py-2 text-[13.5px]">
          Refuser
        </Button>
        <Button type="button" onClick={accept} loading={busy === "accept"} className="!px-3.5 !py-2 text-[13.5px]">
          Sélectionner
        </Button>
      </div>
      {error && <p className="error-text max-w-[220px] text-right">{error}</p>}
    </div>
  );
}
