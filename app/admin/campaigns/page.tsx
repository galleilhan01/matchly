import { createClient } from "@/lib/supabase/server";
import { formatEuros, formatDate } from "@/lib/format";
import { AdminCampaignActions } from "@/components/dashboard/AdminCampaignActions";

export default async function AdminCampaignsPage() {
  const supabase = createClient();
  const { data: campaigns } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false }).limit(200);
  const brandIds = Array.from(new Set((campaigns ?? []).map((c: any) => c.brand_id)));
  const { data: brands } = brandIds.length > 0 ? await supabase.from("brand_profiles").select("profile_id, company_name").in("profile_id", brandIds) : { data: [] as any[] };
  const company = new Map((brands ?? []).map((b: any) => [b.profile_id, b.company_name]));

  return (
    <div>
      <h1 className="font-display text-[26px] font-semibold text-ink">Campagnes</h1>
      <p className="mb-6 mt-1 text-[14.5px] text-ink-soft">Toutes les campagnes de la plateforme.</p>
      {!campaigns || campaigns.length === 0 ? (
        <div className="card py-12 text-center text-[14px] text-ink-soft">Aucune campagne.</div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c: any) => (
            <div key={c.id} className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-ink">{c.title}</p>
                <p className="text-[12.5px] text-ink-soft">
                  {company.get(c.brand_id) || "Marque"} · {formatEuros(c.budget_per_video_cents)} / vidéo · {c.creators_needed} créateur(s) · {formatDate(c.created_at)} · statut : {c.status}
                </p>
              </div>
              <AdminCampaignActions id={c.id} status={c.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
