import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatEuros, formatDate, PLATFORM_LABELS, CONTENT_TYPE_LABELS, initials } from "@/lib/format";

export default async function CreatorCampaignsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: campaigns }, { data: scores }, { data: applications }] = await Promise.all([
    supabase.from("campaigns").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(100),
    supabase.rpc("get_my_scores"),
    supabase.from("applications").select("campaign_id").eq("creator_id", user!.id),
  ]);

  const scoreById = new Map((scores ?? []).map((s: any) => [s.campaign_id, s.score]));
  const applied = new Set((applications ?? []).map((a: any) => a.campaign_id));
  const list = [...(campaigns ?? [])].sort((a: any, b: any) => (scoreById.get(b.id) ?? 0) - (scoreById.get(a.id) ?? 0));

  const brandIds = Array.from(new Set(list.map((c: any) => c.brand_id)));
  const { data: brands } =
    brandIds.length > 0 ? await supabase.from("brand_profiles").select("profile_id, company_name, logo_url").in("profile_id", brandIds) : { data: [] as any[] };
  const brandById = new Map((brands ?? []).map((b: any) => [b.profile_id, b]));

  return (
    <div>
      <h1 className="font-display text-[26px] font-semibold text-ink">Campagnes</h1>
      <p className="mb-8 mt-1 text-[14.5px] text-ink-soft">Triées par compatibilité avec votre profil (recommandation algorithmique, pas une garantie).</p>

      {list.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-[30px]">📭</span>
          <p className="text-[15px] font-semibold text-ink">Aucune campagne publiée pour le moment</p>
          <p className="text-[13.5px] text-ink-soft">Revenez bientôt, de nouvelles campagnes arrivent régulièrement.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((c: any) => {
            const brand: any = brandById.get(c.brand_id);
            const score = scoreById.get(c.id);
            return (
              <div key={c.id} className="card flex flex-col">
                <div className="mb-3 flex items-center gap-3">
                  {brand?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={brand.logo_url} alt="" className="h-10 w-10 rounded-[10px] object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-bg-soft text-[13px] font-semibold text-ink-soft">
                      {initials(brand?.company_name)}
                    </span>
                  )}
                  <p className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink-soft">{brand?.company_name || "Marque"}</p>
                  {score != null && <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[12px] font-semibold text-accent">{String(score)}% compatible</span>}
                </div>
                <p className="text-[16px] font-semibold text-ink">{c.title}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[12.5px] text-ink-soft">
                  {c.platform && <span className="rounded-full border border-line px-2.5 py-0.5">{PLATFORM_LABELS[c.platform]}</span>}
                  {c.content_type && <span className="rounded-full border border-line px-2.5 py-0.5">{CONTENT_TYPE_LABELS[c.content_type]}</span>}
                  {c.niche && <span className="rounded-full border border-line px-2.5 py-0.5">{c.niche}</span>}
                  {c.country && <span className="rounded-full border border-line px-2.5 py-0.5">{c.country}</span>}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                  <div>
                    <p className="text-[15px] font-semibold text-ink">{formatEuros(c.budget_per_video_cents)}</p>
                    <p className="text-[12px] text-ink-soft">Échéance : {formatDate(c.deadline)}</p>
                  </div>
                  <Link href={`/dashboard/creator/campaigns/${c.id}`} className={applied.has(c.id) ? "btn-ghost" : "btn-primary"}>
                    {applied.has(c.id) ? "Candidature envoyée" : "Voir la campagne"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
