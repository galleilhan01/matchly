import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreatorProfileView } from "@/components/profile/CreatorProfileView";
import { ContactCreatorPanel } from "@/components/profile/ContactCreatorPanel";
import { ReportButton } from "@/components/profile/ReportButton";

export default async function BrandCreatorProfilePage({ params, searchParams }: { params: { id: string }; searchParams: { campaign?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const campaignId = searchParams.campaign;
  const [{ data: scores }, { data: campaign }, { data: brand }, { data: creator }] = await Promise.all([
    campaignId ? supabase.rpc("get_campaign_scores", { p_campaign_id: campaignId }) : Promise.resolve({ data: [] as any[] }),
    campaignId ? supabase.from("campaigns").select("title, platform, niche").eq("id", campaignId).single() : Promise.resolve({ data: null as any }),
    supabase.from("brand_profiles").select("company_name, description, industry").eq("profile_id", user!.id).single(),
    supabase.from("profiles").select("full_name").eq("id", params.id).single(),
  ]);

  const score: any = (scores ?? []).find((s: any) => s.creator_id === params.id);

  return (
    <div className="mx-auto max-w-[900px]">
      <Link href={`/dashboard/brand/creators${campaignId ? `?campaign=${campaignId}` : ""}`} className="mb-4 inline-block text-[13.5px] font-medium text-ink-soft hover:text-ink">
        ← Retour aux créateurs
      </Link>

      {score && (
        <div className="mb-6 rounded-[10px] border border-accent/20 bg-accent/5 p-4">
          <p className="text-[15px] font-semibold text-accent">{score.score}% compatible avec « {campaign?.title} »</p>
          <p className="mt-1 text-[13px] text-ink-soft">{score.reasoning} Recommandation algorithmique, pas une garantie de performance.</p>
        </div>
      )}

      <ContactCreatorPanel
        brandId={user!.id}
        creatorId={params.id}
        campaignId={campaignId}
        aiContext={{ brand: brand?.company_name, brand_description: brand?.description, creator: creator?.full_name, campaign: campaign?.title }}
      />

      <CreatorProfileView creatorId={params.id} />

      <div className="mt-6">
        <ReportButton reporterId={user!.id} reportedProfileId={params.id} />
      </div>
    </div>
  );
}
