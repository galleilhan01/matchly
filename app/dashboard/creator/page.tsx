import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export default async function CreatorDashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: applications }, { data: missions }, { data: payments }, { data: recommended }] = await Promise.all([
    supabase.from("applications").select("id, status, campaign_id").eq("creator_id", user!.id),
    supabase.from("missions").select("id, status, campaign_id").eq("creator_id", user!.id),
    supabase.from("payments").select("amount_creator_cents, status").eq("creator_id", user!.id),
    supabase
      .from("campaigns")
      .select("id, title, platform, content_type, budget_per_video_cents, deadline, niche")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const { data: scores } =
    recommended && recommended.length > 0
      ? await supabase
          .from("campaign_creator_scores")
          .select("campaign_id, score")
          .eq("creator_id", user!.id)
          .in("campaign_id", recommended.map((c: any) => c.id))
      : { data: [] as any[] };

  const activeMissions = (missions ?? []).filter((m: any) => m.status !== "completed");
  const totalEarned = (payments ?? [])
    .filter((p: any) => p.status === "released")
    .reduce((sum: number, p: any) => sum + p.amount_creator_cents, 0);
  const pendingEarnings = (payments ?? [])
    .filter((p: any) => p.status === "held" || p.status === "pending")
    .reduce((sum: number, p: any) => sum + p.amount_creator_cents, 0);

  const appliedCampaignIds = new Set((applications ?? []).map((a: any) => a.campaign_id));

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
        <StatCard label="En attente" value={formatEuros(pendingEarnings)} hint="Après validation des vidéos" />
      </div>

      <div>
        <h2 className="mb-4 font-display text-[18px] font-semibold text-ink">Campagnes recommandées</h2>

        {!recommended || recommended.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-[32px]">🔍</span>
            <p className="text-[15px] font-semibold text-ink">Aucune campagne disponible pour le moment</p>
            <p className="max-w-[360px] text-[14px] text-ink-soft">
              Complétez votre profil pour améliorer vos recommandations dès qu'une campagne compatible est publiée.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommended.map((campaign: any) => {
              const score = (scores ?? []).find((s: any) => s.campaign_id === campaign.id);
              const alreadyApplied = appliedCampaignIds.has(campaign.id);

              return (
                <div key={campaign.id} className="card flex items-center gap-6">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center gap-2">
                      {score && (
                        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[12px] font-semibold text-accent">
                          {Math.round(score.score)}% compatible
                        </span>
                      )}
                      {campaign.deadline && (
                        <span className="text-[12.5px] text-ink-soft">
                          Échéance : {new Date(campaign.deadline).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[15.5px] font-semibold text-ink">{campaign.title}</p>
                    <p className="mt-1 text-[13px] text-ink-soft">
                      {formatEuros(campaign.budget_per_video_cents)} / vidéo
                      {campaign.niche ? ` · ${campaign.niche}` : ""}
                    </p>
                  </div>

                  <Link
                    href={`/dashboard/creator/campaigns/${campaign.id}`}
                    className={alreadyApplied ? "btn-ghost" : "btn-primary"}
                  >
                    {alreadyApplied ? "Candidature envoyée" : "Voir la campagne"}
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
