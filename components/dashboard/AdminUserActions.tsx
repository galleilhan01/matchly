"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminUserActions({ id, verified, suspended }: { id: string; verified: boolean; suspended: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(patch: Record<string, boolean>, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from("profiles").update(patch).eq("id", id);
    setBusy(false);
    if (err) return setError(err.message);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button disabled={busy} onClick={() => update({ is_verified: !verified })} className="rounded-[8px] border border-line px-2.5 py-1 text-[12.5px] font-medium hover:bg-bg-soft">
        {verified ? "Retirer la vérification" : "Vérifier"}
      </button>
      <button
        disabled={busy}
        onClick={() => update({ is_suspended: !suspended }, suspended ? undefined : "Suspendre ce compte ? L'utilisateur ne pourra plus accéder à la plateforme.")}
        className={`rounded-[8px] border px-2.5 py-1 text-[12.5px] font-medium ${suspended ? "border-emerald-300 text-emerald-700" : "border-red-200 text-red-600"} hover:bg-bg-soft`}
      >
        {suspended ? "Réactiver" : "Suspendre"}
      </button>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
