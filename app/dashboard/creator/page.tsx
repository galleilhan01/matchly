import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatEuros, formatDate, MISSION_STATUS } from "@/lib/format";

export default async function CreatorDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: applications }, { data: missions }, { data: payments }, { data: scores }] = await Promise.all([
    supabase.from("applications").select("id, status, campaign_id").eq("creator_id", user!.id),
    supabase.from("missions").select("id, status, campaign_id").eq("creator_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("payments").select("amount_creator_cents, status").eq("creator_id", user!.id),
    supabase.rpc("get_my_scores"),
  ]);

  const topScores = (scores ?? []).slice(0, 4);
  const missionList = missions ?? [];
  const activeMissions = missionList.filter((m: any) => m.status !== "completed");

  const campaignIds = Array.from(new Set([...topScores.map((s: any) => s.campaign_id), ...missionList.map((m: any) => m.campaign_id)]));
  const { data: campaigns } =
    campaignIds.length > 0
      ? await supabase.from("campaigns").select("id, title, budget_per_video_cents, deadline, niche, platform, brand_id").in("id", campaignIds)
      : { data: [] as any[] };
  const campaignById = new Map<string, any>((campaigns ?? []).map((c: any) => [c.id, c] as [string, any]));

  const brandIds = Array.from(new Set((campaigns ?? []).map((c: any) => c.brand_id)));
  const { data: brands } =
    brandIds.length > 0
      ? await supabase.from("brand_profiles").select("profile_id, company_name, logo_url").in("profile_id", brandIds)
      : { data: [] as any[] };
  const brandById = new Map<string, any>((brands ?? []).map((b: any) => [b.profile_id, b] as [string, any]));

  const appliedIds = new Set((applications ?? []).map((a: any) => a.campaign_id));
  const totalEarned = (payments ?? []).filter((p: any) => p.status === "released").reduce((s: number, p: any) => s + p.amount_creator_cents, 0);
  const pending = (payments ?? []).filter((p: any) => p.status === "held" || p.status === "pending").reduce((s: number, p: any) => s + p.amount_creator_cents, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[26px] font-semibold text-ink">Bonjour 👋</h1>
        <p className="mt-1 text-[14.5px] text-ink-soft">Voici vos opportunités et l'avancement de vos missions.</p>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Missions actives" value={String(activeMissions.length)} />
        <StatCard label="Candidatures" value={String(applications?.length ?? 0)} />
        <StatCard label="Revenus perçus" value={formatEuros(totalEarned)} />
        <StatCard label="En attente" value={formatEuros(pending)} hint="Après validation des vidéos" />
      </div>

      {activeMissions.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 font-display text-[18px] font-semibold text-ink">Missions en cours</h2>
          <div className="space-y-3">
            {activeMissions.map((m: any) => {
              const c: any = campaignById.get(m.campaign_id);
              const st = MISSION_STATUS[m.status];
              return (
                <Link key={m.id} href={`/dashboard/creator/missions/${m.id}`} className="card flex items-center justify-between gap-4 transition hover:border-accent/40">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-ink">{c?.title ?? "Campagne"}</p>
                    <p className="text-[13px] text-ink-soft">{brandById.get(c?.brand_id)?.company_name} · Échéance {formatDate(c?.deadline)}</p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${st?.className}`}>{st?.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[18px] font-semibold text-ink">Campagnes recommandées</h2>
          <Link href="/dashboard/creator/campaigns" className="text-[13.5px] font-medium text-accent">
            Tout voir →
          </Link>
        </div>

        {topScores.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 py-14 text-center">
            <span className="text-[32px]">🔍</span>
            <p className="text-[15px] font-semibold text-ink">Aucune campagne disponible pour le moment</p>
            <p className="max-w-[380px] text-[14px] text-ink-soft">
              Complétez votre profil pour de meilleures recommandations dès qu'une campagne compatible est publiée.
            </p>
            <Link href="/dashboard/creator/profile/edit" className="btn-primary mt-2">
              Compléter mon profil
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {topScores.map((s: any) => {
              const c: any = campaignById.get(s.campaign_id);
              if (!c) return null;
              const brand: any = brandById.get(c.brand_id);
              return (
                <div key={s.campaign_id} className="card flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[12px] font-semibold text-accent">{s.score}% compatible</span>
                      <span className="text-[12.5px] text-ink-soft">Échéance : {formatDate(c.deadline)}</span>
                    </div>
                    <p className="truncate text-[15.5px] font-semibold text-ink">{c.title}</p>
                    <p className="mt-1 text-[13px] text-ink-soft">
                      {brand?.company_name} · {formatEuros(c.budget_per_video_cents)} / vidéo{c.niche ? ` · ${c.niche}` : ""}
                    </p>
                  </div>
                  <Link href={`/dashboard/creator/campaigns/${c.id}`} className={appliedIds.has(c.id) ? "btn-ghost" : "btn-primary"}>
                    {appliedIds.has(c.id) ? "Candidature envoyée" : "Voir la campagne"}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
