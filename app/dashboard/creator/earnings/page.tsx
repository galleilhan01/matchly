import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatEuros, formatDate } from "@/lib/format";

const STATUS: Record<string, string> = { pending: "En attente", held: "Retenu (en attente de validation)", released: "Versé", refunded: "Remboursé", failed: "Échoué" };

export default async function EarningsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: payments } = await supabase.from("payments").select("*").eq("creator_id", user!.id).order("created_at", { ascending: false });
  const list = payments ?? [];
  const released = list.filter((p: any) => p.status === "released").reduce((s: number, p: any) => s + p.amount_creator_cents, 0);
  const pending = list.filter((p: any) => p.status === "held" || p.status === "pending").reduce((s: number, p: any) => s + p.amount_creator_cents, 0);

  return (
    <div>
      <h1 className="font-display text-[26px] font-semibold text-ink">Revenus</h1>
      <p className="mb-8 mt-1 text-[14.5px] text-ink-soft">Vos paiements pour les missions validées.</p>
      <div className="mb-8 grid grid-cols-2 gap-4 md:max-w-[520px]">
        <StatCard label="Total perçu" value={formatEuros(released)} />
        <StatCard label="En attente" value={formatEuros(pending)} />
      </div>
      {list.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-14 text-center">
          <span className="text-[30px]">💰</span>
          <p className="text-[15px] font-semibold text-ink">Aucun paiement pour l'instant</p>
          <p className="max-w-[400px] text-[13.5px] text-ink-soft">Vos revenus apparaîtront ici une fois vos vidéos validées par les marques.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((p: any) => (
            <div key={p.id} className="card flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-ink">{formatEuros(p.amount_creator_cents)}</p>
                <p className="text-[12.5px] text-ink-soft">{formatDate(p.created_at)}</p>
              </div>
              <span className="text-[13px] text-ink-soft">{STATUS[p.status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
