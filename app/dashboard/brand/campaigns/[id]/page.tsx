import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AcceptApplicationButton } from "@/components/dashboard/AcceptApplicationButton";

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", params.id).single();
  if (!campaign) notFound();

  const { data: applications } = await supabase
    .from("applications")
    .select("id, message, status, created_at, creator_id")
    .eq("campaign_id", params.id)
    .order("created_at", { ascending: false });

  const creatorIds = (applications ?? []).map((a: any) => a.creator_id);

  const [{ data: creators }, { data: scores }, { data: missions }] = await Promise.all([
    creatorIds.length > 0
      ? supabase.from("creator_profiles").select("profile_id, bio, country, categories").in("profile_id", creatorIds)
      : Promise.resolve({ data: [] as any[] }),
    creatorIds.length > 0
      ? supabase.from("campaign_creator_scores").select("creator_id, score, reasoning").eq("campaign_id", params.id)
      : Promise.resolve({ data: [] as any[] }),
    supabase.from("missions").select("creator_id").eq("campaign_id", params.id),
  ]);

  const { data: profiles } =
    creatorIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", creatorIds)
      : { data: [] as any[] };

  const selectedCreatorIds = new Set((missions ?? []).map((m: any) => m.creator_id));

  return (
    <div>
      <Link href="/dashboard/brand" className="mb-4 inline-block text-[13.5px] font-medium text-ink-soft hover:text-ink">
        ← Retour au dashboard
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-[24px] font-semibold text-ink">{campaign.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[13.5px] text-ink-soft">
            <span>{formatEuros(campaign.budget_per_video_cents)} / vidéo</span>
            <span>·</span>
            <span>{campaign.creators_needed} créateur{campaign.creators_needed > 1 ? "s" : ""} recherché{campaign.creators_needed > 1 ? "s" : ""}</span>
            {campaign.deadline && (
              <>
                <span>·</span>
                <span>Échéance : {new Date(campaign.deadline).toLocaleDateString("fr-FR")}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {campaign.deliverables && (
        <div className="card mb-6">
          <p className="mb-1 text-[13px] font-semibold text-ink-soft">Livrable attendu</p>
          <p className="text-[14.5px] text-ink">{campaign.deliverables}</p>
        </div>
      )}

      <h2 className="mb-4 font-display text-[18px] font-semibold text-ink">
        Candidatures {applications && applications.length > 0 ? `(${applications.length})` : ""}
      </h2>

      {!applications || applications.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-14 text-center">
          <span className="text-[28px]">📭</span>
          <p className="text-[14.5px] font-semibold text-ink">Aucune candidature pour l'instant</p>
          <p className="text-[13.5px] text-ink-soft">Les créateurs compatibles verront cette campagne dans leurs recommandations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app: any) => {
            const creator = (creators ?? []).find((c: any) => c.profile_id === app.creator_id);
            const profile = (profiles ?? []).find((p: any) => p.id === app.creator_id);
            const score = (scores ?? []).find((s: any) => s.creator_id === app.creator_id);
            const alreadySelected = selectedCreatorIds.has(app.creator_id);

            return (
              <div key={app.id} className="card flex items-start gap-4">
                <div className="h-11 w-11 flex-shrink-0 rounded-full bg-bg-soft" />

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="font-semibold text-ink">{profile?.full_name || "Créateur"}</p>
                    {score && (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[12px] font-semibold text-accent">
                        {Math.round(score.score)}% compatible
                      </span>
                    )}
                  </div>
                  {creator && (
                    <p className="text-[13px] text-ink-soft">
                      {creator.country}
                      {creator.categories?.length ? ` · ${creator.categories.join(", ")}` : ""}
                    </p>
                  )}
                  {app.message && <p className="mt-2 text-[14px] text-ink">{app.message}</p>}
                </div>

                <div className="flex-shrink-0">
                  {alreadySelected ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[13px] font-semibold text-emerald-700">
                      Sélectionné
                    </span>
                  ) : app.status === "pending" ? (
                    <AcceptApplicationButton
                      applicationId={app.id}
                      campaignId={campaign.id}
                      creatorId={app.creator_id}
                      brandId={user!.id}
                    />
                  ) : (
                    <span className="text-[13px] text-ink-soft capitalize">{app.status}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
