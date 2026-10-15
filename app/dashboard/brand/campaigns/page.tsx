import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatEuros, formatDate } from "@/lib/format";

const STATUS: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-line text-ink-soft" },
  published: { label: "Publiée", className: "bg-accent/10 text-accent" },
  in_progress: { label: "En cours", className: "bg-amber-100 text-amber-700" },
  completed: { label: "Terminée", className: "bg-emerald-100 text-emerald-700" },
  archived: { label: "Archivée", className: "bg-line text-ink-soft" },
};

export default async function BrandCampaignsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: campaigns } = await supabase.from("campaigns").select("*").eq("brand_id", user!.id).order("created_at", { ascending: false });
  const ids = (campaigns ?? []).map((c: any) => c.id);
  const { data: applications } = ids.length > 0 ? await supabase.from("applications").select("campaign_id").in("campaign_id", ids) : { data: [] as any[] };
  const countByCampaign = (applications ?? []).reduce((acc: Record<string, number>, a: any) => ({ ...acc, [a.campaign_id]: (acc[a.campaign_id] ?? 0) + 1 }), {});

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-semibold text-ink">Campagnes</h1>
          <p className="mt-1 text-[14.5px] text-ink-soft">Toutes vos campagnes.</p>
        </div>
        <Link href="/dashboard/brand/campaigns/new" className="btn-primary">
          + Créer une campagne
        </Link>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-[32px]">📣</span>
          <p className="text-[15px] font-semibold text-ink">Aucune campagne pour l'instant</p>
          <Link href="/dashboard/brand/campaigns/new" className="btn-primary mt-2">
            + Créer une campagne
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c: any) => (
            <Link key={c.id} href={`/dashboard/brand/campaigns/${c.id}`} className="card flex flex-col gap-2 transition hover:border-accent/40 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${STATUS[c.status]?.className}`}>{STATUS[c.status]?.label}</span>
                <p className="mt-1.5 truncate text-[15.5px] font-semibold text-ink">{c.title}</p>
              </div>
              <div className="flex flex-wrap gap-x-4 text-[13px] text-ink-soft">
                <span>{formatEuros(c.budget_per_video_cents)} / vidéo</span>
                <span>
                  {countByCampaign[c.id] ?? 0} candidature{(countByCampaign[c.id] ?? 0) > 1 ? "s" : ""}
                </span>
                <span>Échéance {formatDate(c.deadline)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
