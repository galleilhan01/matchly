import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatEuros } from "@/lib/format";

async function count(table: string, filter?: (q: any) => any) {
  const supabase = createClient();
  let q: any = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c ?? 0;
}

export default async function AdminHomePage() {
  const supabase = createClient();
  const [brands, creators, campaigns, activeCampaigns, missions, openReports, suspended, unverified] = await Promise.all([
    count("profiles", (q) => q.eq("account_type", "brand")),
    count("profiles", (q) => q.eq("account_type", "creator")),
    count("campaigns"),
    count("campaigns", (q) => q.in("status", ["published", "in_progress"])),
    count("missions"),
    count("reports", (q) => q.eq("status", "open")),
    count("profiles", (q) => q.eq("is_suspended", true)),
    count("profiles", (q) => q.eq("is_verified", false).neq("account_type", "admin")),
  ]);
  const { data: payments } = await supabase.from("payments").select("amount_total_cents, commission_cents, status");
  const valid = (payments ?? []).filter((p: any) => p.status === "held" || p.status === "released");
  const volume = valid.reduce((s: number, p: any) => s + p.amount_total_cents, 0);
  const commissions = valid.reduce((s: number, p: any) => s + p.commission_cents, 0);

  return (
    <div>
      <h1 className="font-display text-[26px] font-semibold text-ink">Statistiques</h1>
      <p className="mb-8 mt-1 text-[14.5px] text-ink-soft">Vue d'ensemble de la plateforme.</p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Marques" value={String(brands)} />
        <StatCard label="Créateurs" value={String(creators)} />
        <StatCard label="Campagnes" value={String(campaigns)} hint={`${activeCampaigns} actives`} />
        <StatCard label="Missions" value={String(missions)} />
        <StatCard label="Volume de paiements" value={formatEuros(volume)} />
        <StatCard label="Commissions" value={formatEuros(commissions)} />
        <StatCard label="Signalements ouverts" value={String(openReports)} />
        <StatCard label="Comptes à vérifier" value={String(unverified)} hint={`${suspended} suspendu${suspended > 1 ? "s" : ""}`} />
      </div>
    </div>
  );
}
