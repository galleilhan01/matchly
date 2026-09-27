import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-line text-ink-soft" },
  published: { label: "Publiée", className: "bg-accent/10 text-accent" },
  in_progress: { label: "En cours", className: "bg-amber-100 text-amber-700" },
  completed: { label: "Terminée", className: "bg-emerald-100 text-emerald-700" },
  archived: { label: "Archivée", className: "bg-line text-ink-soft" },
};

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export default async function BrandDashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("brand_id", user!.id)
    .order("created_at", { ascending: false });

  const campaignIds = (campaigns ?? []).map((c: any) => c.id);

  const { data: applications } =
    campaignIds.length > 0
      ? await supabase.from("applications").select("id, campaign_id, status").in("campaign_id", campaignIds)
      : { data: [] as any[] };

  const { data: missions } =
    campaignIds.length > 0
      ? await supabase.from("missions").select("id, campaign_id, status").in("campaign_id", campaignIds)
      : { data: [] as any[] };

  const activeCampaigns = (campaigns ?? []).filter((c: any) => c.status === "published" || c.status === "in_progress");
  const totalApplications = applications?.length ?? 0;
  const selectedCreators = missions?.length ?? 0;
  const budgetSpent = (missions ?? []).reduce((sum: number, m: any) => {
    const campaign = (campaigns ?? []).find((c: any) => c.id === m.campaign_id);
    return sum + (campaign?.budget_per_video_cents ?? 0);
  }, 0);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[26px] font-semibold text-ink">Bonjour 👋</h1>
          <p className="mt-1 text-[14.5px] text-ink-soft">Voici un aperçu de vos campagnes en cours.</p>
        </div>
        <Link href="/dashboard/brand/campaigns/new" className="btn-primary">
          + Créer une campagne
        </Link>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Campagnes actives" value={String(activeCampaigns.length)} />
        <StatCard label="Candidatures" value={String(totalApplications)} />
        <StatCard label="Créateurs sélectionnés" value={String(selectedCreators)} />
        <StatCard label="Budget dépensé" value={formatEuros(budgetSpent)} />
      </div>

      <div>
        <h2 className="mb-4 font-display text-[18px] font-semibold text-ink">Vos campagnes</h2>

        {!campaigns || campaigns.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-[32px]">📣</span>
            <p className="text-[15px] font-semibold text-ink">Aucune campagne pour l'instant</p>
            <p className="max-w-[360px] text-[14px] text-ink-soft">
              Créez votre première campagne — décrivez votre besoin en une phrase, l'IA structure le reste.
            </p>
            <Link href="/dashboard/brand/campaigns/new" className="btn-primary mt-2">
              + Créer une campagne
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign: any) => {
              const campaignApplications = (applications ?? []).filter((a: any) => a.campaign_id === campaign.id);
              const campaignMissions = (missions ?? []).filter((m: any) => m.campaign_id === campaign.id);
              const progress = campaign.creators_needed
                ? Math.min(100, Math.round((campaignMissions.length / campaign.creators_needed) * 100))
                : 0;
              const status = STATUS_LABELS[campaign.status] ?? STATUS_LABELS.draft;

              return (
                <Link
                  key={campaign.id}
                  href={`/dashboard/brand/campaigns/${campaign.id}`}
                  className="card flex items-center gap-6 transition hover:border-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                      {campaign.deadline && (
                        <span className="text-[12.5px] text-ink-soft">
                          Échéance : {new Date(campaign.deadline).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[15.5px] font-semibold text-ink">{campaign.title}</p>
                    <div className="mt-2 flex items-center gap-4 text-[13px] text-ink-soft">
                      <span>{formatEuros(campaign.budget_per_video_cents)} / vidéo</span>
                      <span>{campaignApplications.length} candidature{campaignApplications.length > 1 ? "s" : ""}</span>
                      <span>{campaignMissions.length}/{campaign.creators_needed} créateurs sélectionnés</span>
                    </div>
                  </div>

                  <div className="w-32 flex-shrink-0">
                    <div className="mb-1.5 flex justify-between text-[12px] text-ink-soft">
                      <span>Progression</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
