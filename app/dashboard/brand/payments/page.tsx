import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatEuros, formatDate } from "@/lib/format";

const STATUS: Record<string, string> = { pending: "En attente", held: "Retenu jusqu'à validation", released: "Versé au créateur", refunded: "Remboursé", failed: "Échoué" };

export default async function BrandPaymentsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: payments } = await supabase.from("payments").select("*").eq("brand_id", user!.id).order("created_at", { ascending: false });
  const list = payments ?? [];
  const total = list.filter((p: any) => p.status !== "failed" && p.status !== "refunded").reduce((s: number, p: any) => s + p.amount_total_cents, 0);

  return (
    <div>
      <h1 className="font-display text-[26px] font-semibold text-ink">Paiements</h1>
      <p className="mb-8 mt-1 text-[14.5px] text-ink-soft">Historique de vos règlements aux créateurs.</p>
      <div className="mb-8 max-w-[260px]">
        <StatCard label="Total réglé" value={formatEuros(total)} />
      </div>
      {list.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-14 text-center">
          <span className="text-[30px]">💳</span>
          <p className="text-[15px] font-semibold text-ink">Aucun paiement pour l'instant</p>
          <p className="max-w-[420px] text-[13.5px] text-ink-soft">
            Le règlement des missions via Stripe sera disponible prochainement. Vos paiements et commissions apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((p: any) => (
            <div key={p.id} className="card flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[15px] font-semibold text-ink">{formatEuros(p.amount_total_cents)}</p>
                <p className="text-[12.5px] text-ink-soft">
                  Créateur {formatEuros(p.amount_creator_cents)} · Commission {formatEuros(p.commission_cents)} · {formatDate(p.created_at)}
                </p>
              </div>
              <span className="text-[13px] text-ink-soft">{STATUS[p.status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
