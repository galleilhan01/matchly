import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApplyForm } from "@/components/dashboard/ApplyForm";
import { formatEuros, formatDate, PLATFORM_LABELS, CONTENT_TYPE_LABELS, APPLICATION_STATUS } from "@/lib/format";

export default async function CreatorCampaignPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", params.id).single();
  if (!campaign) notFound();

  const [{ data: brand }, { data: application }, { data: scores }, { data: creator }] = await Promise.all([
    supabase.from("brand_profiles").select("company_name, description, website, logo_url").eq("profile_id", campaign.brand_id).single(),
    supabase.from("applications").select("status, message").eq("campaign_id", params.id).eq("creator_id", user!.id).maybeSingle(),
    supabase.rpc("get_my_scores"),
    supabase.from("creator_profiles").select("bio, categories, country").eq("profile_id", user!.id).single(),
  ]);

  const score: any = (scores ?? []).find((s: any) => s.campaign_id === params.id);
  const aiContext = {
    campaign: { title: campaign.title, platform: campaign.platform, niche: campaign.niche, deliverables: campaign.deliverables },
    brand: brand?.company_name,
    creator: { bio: creator?.bio, categories: creator?.categories, country: creator?.country },
  };

  return (
    <div className="mx-auto max-w-[760px]">
      <Link href="/dashboard/creator/campaigns" className="mb-4 inline-block text-[13.5px] font-medium text-ink-soft hover:text-ink">
        ← Toutes les campagnes
      </Link>

      <div className="mb-6">
        <p className="text-[14px] font-medium text-ink-soft">{brand?.company_name}</p>
        <h1 className="mt-1 font-display text-[26px] font-semibold text-ink">{campaign.title}</h1>
        {score && (
          <div className="mt-3 rounded-[10px] border border-accent/20 bg-accent/5 p-3">
            <p className="text-[14px] font-semibold text-accent">{score.score}% compatible avec votre profil</p>
            <p className="mt-0.5 text-[12.5px] text-ink-soft">{score.reasoning} Recommandation algorithmique, pas une garantie de sélection.</p>
          </div>
        )}
      </div>

      <div className="card mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Info label="Budget" value={formatEuros(campaign.budget_per_video_cents) + " / vidéo"} />
        <Info label="Échéance" value={formatDate(campaign.deadline)} />
        <Info label="Plateforme" value={campaign.platform ? PLATFORM_LABELS[campaign.platform] : "—"} />
        <Info label="Contenu" value={campaign.content_type ? CONTENT_TYPE_LABELS[campaign.content_type] : "—"} />
        <Info label="Pays" value={campaign.country || "—"} />
        <Info label="Âge cible" value={campaign.target_age_min ? `${campaign.target_age_min}-${campaign.target_age_max ?? "+"} ans` : "—"} />
        <Info label="Niche" value={campaign.niche || "—"} />
        <Info label="Créateurs" value={String(campaign.creators_needed)} />
      </div>

      {campaign.deliverables && (
        <div className="card mb-6">
          <p className="mb-1 text-[13px] font-semibold text-ink-soft">Livrable attendu</p>
          <p className="text-[14.5px] text-ink">{campaign.deliverables}</p>
        </div>
      )}

      {brand?.description && (
        <div className="card mb-6">
          <p className="mb-1 text-[13px] font-semibold text-ink-soft">À propos de la marque</p>
          <p className="text-[14.5px] text-ink">{brand.description}</p>
        </div>
      )}

      {application ? (
        <div className="card">
          <p className="mb-1 text-[13px] font-semibold text-ink-soft">Votre candidature</p>
          <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${APPLICATION_STATUS[application.status]?.className}`}>
            {APPLICATION_STATUS[application.status]?.label}
          </span>
          {application.message && <p className="mt-3 text-[14px] text-ink">{application.message}</p>}
        </div>
      ) : campaign.status === "published" ? (
        <ApplyForm campaignId={campaign.id} userId={user!.id} aiContext={aiContext} />
      ) : (
        <div className="card text-[14px] text-ink-soft">Cette campagne n'accepte plus de candidatures.</div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-ink-soft">{label}</p>
      <p className="mt-0.5 text-[14px] font-semibold text-ink">{value}</p>
    </div>
  );
}
