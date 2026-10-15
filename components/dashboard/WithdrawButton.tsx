"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function WithdrawButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function withdraw() {
    if (!confirm("Retirer cette candidature ?")) return;
    setLoading(true);
    await supabase.from("applications").update({ status: "withdrawn" }).eq("id", applicationId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={withdraw} disabled={loading} className="text-[13px] font-medium text-ink-soft hover:text-red-600">
      {loading ? "…" : "Retirer"}
    </button>
  );
}
