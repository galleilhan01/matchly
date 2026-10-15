"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { formatEuros } from "@/lib/format";

export function CommissionForm({ initialRate }: { initialRate: number }) {
  const supabase = createClient();
  const [percent, setPercent] = useState(String(Math.round(initialRate * 1000) / 10));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const p = Number(percent);
  const valid = !Number.isNaN(p) && p >= 0 && p <= 50;
  const example = 50000;
  const commission = valid ? Math.round((example * p) / 100) : 0;

  async function save() {
    if (!valid) return setMsg({ ok: false, text: "Entrez un pourcentage entre 0 et 50." });
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.from("platform_settings").upsert({ key: "commission_rate", value: p / 100, updated_at: new Date().toISOString() });
    setSaving(false);
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Commission enregistrée ✓" });
  }

  return (
    <div className="card">
      <label className="mb-2 block text-[14px] font-medium text-ink">Commission plateforme (%)</label>
      <input className="input" type="number" min={0} max={50} step={0.5} value={percent} onChange={(e) => setPercent(e.target.value)} />
      <div className="mt-4 rounded-[10px] bg-bg-soft p-4 text-[13.5px] text-ink-soft">
        Exemple pour une mission à <strong className="text-ink">{formatEuros(example)}</strong> : créateur <strong className="text-ink">{formatEuros(example - commission)}</strong>, commission plateforme <strong className="text-ink">{formatEuros(commission)}</strong>.
      </div>
      {msg && <p className={`mt-3 text-[13.5px] ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
      <Button type="button" className="mt-4" onClick={save} loading={saving}>
        Enregistrer
      </Button>
    </div>
  );
}
