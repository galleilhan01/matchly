import { createClient } from "@/lib/supabase/server";
import { formatEuros, formatDate } from "@/lib/format";

export default async function AdminPaymentsPage() {
  const supabase = createClient();
  const { data: payments } = await supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(200);

  return (
    <div>
      <h1 className="font-display text-[26px] font-semibold text-ink">Paiements</h1>
      <p className="mb-6 mt-1 text-[14.5px] text-ink-soft">Flux Marque → Plateforme → Créateur.</p>
      {!payments || payments.length === 0 ? (
        <div className="card py-12 text-center text-[14px] text-ink-soft">Aucun paiement pour l'instant.</div>
      ) : (
        <div className="space-y-3">
          {payments.map((p: any) => (
            <div key={p.id} className="card flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[15px] font-semibold text-ink">{formatEuros(p.amount_total_cents)}</p>
                <p className="text-[12.5px] text-ink-soft">
                  Créateur {formatEuros(p.amount_creator_cents)} · Commission {formatEuros(p.commission_cents)} · {formatDate(p.created_at)}
                </p>
              </div>
              <span className="text-[13px] text-ink-soft">{p.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
