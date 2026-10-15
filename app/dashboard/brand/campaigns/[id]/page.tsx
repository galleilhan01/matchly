import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AcceptApplicationButton } from "@/components/dashboard/AcceptApplicationButton";
import { AiToolsPanel } from "@/components/ai/AiToolsPanel";
import { CampaignStatusSelect } from "@/components/dashboard/CampaignStatusSelect";
import { formatEuros, formatDate, initials, MISSION_STATUS, PLATFORM_LABELS, CONTENT_TYPE_LABELS } from "@/lib/format";

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", params.id).single();
  if (!campaign || campaign.brand_id !== user!.id) notFound();

  const [{ data: applications }, { data: missions }, { data: scores }] = await Promise.all([
    supabase.from("applications").select("id, message, status, created_at, creator_id").eq("campaign_id", params.id).order("created_at", { ascending: false }),
    supabase.from("missions").select("id, creator_id, status").eq("campaign_id", params.id),
    supabase.rpc("get_campaign_scores", { p_campaign_id: params.id }),
  ]);

  const scoreByCreator = new Map((scores ?? []).map((s: any) => [s.creator_id, s]));
  const missionByCreator = new Map((missions ?? []).map((m: any) => [m.creator_id, m]));
  const appliedIds = new Set((applications ?? []).map((a: any) => a.creator_id));

  const recommended = (scores ?? []).filter((s: any) => !appliedIds.has(s.creator_id)).slice(0, 5);
  const idsToLoad = Array.from(new Set([...(applications ?? []).map((a: any) => a.creator_id), ...recommended.map((s: any) => s.creator_id)]));

  const [{ data: profiles }, { data: creatorProfiles }] =
    idsToLoad.length > 0
      ? await Promise.all([
          supabase.from("profiles").select("id, full_name, avatar_url, is_verified").in("id", idsToLoad),
          supabase.from("creator_profiles").select("profile_id, country, categories").in("profile_id", idsToLoad),
        ])
      : [{ data: [] as any[] }, { data: [] as any[] }];

  const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  const creatorById = new Map((creatorProfiles ?? []).map((c: any) => [c.profile_id, c]));

  const missionsByStatus: Record<string, number> = {};
  (missions ?? []).forEach((m: any) => {
    missionsByStatus[m.status] = (missionsByStatus[m.status] ?? 0) + 1;
  });

  const stats = {
    applications: applications?.length ?? 0,
    pending: (applications ?? []).filter((a: any) => a.status === "pending").length,
    selected: missions?.length ?? 0,
    missionsByStatus,
    creatorsNeeded: campaign.creators_needed,
    budgetPerVideoEuros: campaign.budget_per_video_cents / 100,
  };

  const aiContext = {
    campaign: {
      title: campaign.title,
      platform: campaign.platform,
      content_type: campaign.content_type,
      niche: campaign.niche,
      country: campaign.country,
      language: campaign.language,
      target_age: [campaign.target_age_min, campaign.target_age_max],
      budget_per_video_eur: campaign.budget_per_video_cents / 100,
      deliverables: campaign.deliverables,
      brief: campaign.raw_brief,
    },
    stats,
  };

  return (
    <div>
      <Link href="/dashboard/brand/campaigns" className="mb-4 inline-block text-[13.5px] font-medium text-ink-soft hover:text-ink">
        ← Toutes les campagnes
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-semibold text-ink">{campaign.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-ink-soft">
            <span>{formatEuros(campaign.budget_per_video_cents)} / vidéo</span>
            <span>·</span>
            <span>
              {campaign.creators_needed} créateur{campaign.creators_needed > 1 ? "s" : ""}
            </span>
            {campaign.platform && <><span>·</span><span>{PLATFORM_LABELS[campaign.platform]}</span></>}
            {campaign.content_type && <><span>·</span><span>{CONTENT_TYPE_LABELS[campaign.content_type]}</span></>}
            <span>·</span>
            <span>Échéance : {formatDate(campaign.deadline)}</span>
          </div>
        </div>
        <CampaignStatusSelect campaignId={campaign.id} status={campaign.status} />
      </div>

      {campaign.deliverables && (
        <div className="card mb-6">
          <p className="mb-1 text-[13px] font-semibold text-ink-soft">Livrable attendu</p>
          <p className="text-[14.5px] text-ink">{campaign.deliverables}</p>
        </div>
      )}

      <AiToolsPanel context={aiContext} />

      <h2 className="mb-4 font-display text-[18px] font-semibold text-ink">
        Candidatures {applications && applications.length > 0 ? `(${applications.length})` : ""}
      </h2>

      {!applications || applications.length === 0 ? (
        <div className="card mb-10 flex flex-col items-center gap-2 py-12 text-center">
          <span className="text-[28px]">📭</span>
          <p className="text-[14.5px] font-semibold text-ink">Aucune candidature pour l'instant</p>
          <p className="text-[13.5px] text-ink-soft">Les créateurs compatibles voient cette campagne dans leurs recommandations.</p>
        </div>
      ) : (
        <div className="mb-10 space-y-3">
          {applications.map((app: any) => {
            const profile: any = profileById.get(app.creator_id);
            const creator: any = creatorById.get(app.creator_id);
            const score: any = scoreByCreator.get(app.creator_id);
            const mission: any = missionByCreator.get(app.creator_id);
            return (
              <div key={app.id} className="card flex flex-col gap-4 sm:flex-row sm:items-start">
                <Avatar name={profile?.full_name} url={profile?.avatar_url} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/brand/creators/${app.creator_id}?campaign=${campaign.id}`} className="font-semibold text-ink hover:text-accent">
                      {profile?.full_name || "Créateur"}
                    </Link>
                    {score && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[12px] font-semibold text-accent">{score.score}% compatible</span>}
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
                  {mission ? (
                    <Link href={`/dashboard/brand/missions/${mission.id}`} className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${MISSION_STATUS[mission.status]?.className}`}>
                      {MISSION_STATUS[mission.status]?.label} →
                    </Link>
                  ) : app.status === "pending" ? (
                    <AcceptApplicationButton applicationId={app.id} />
                  ) : (
                    <span className="text-[13px] capitalize text-ink-soft">{app.status === "rejected" ? "Refusée" : app.status === "withdrawn" ? "Retirée" : app.status}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="mb-1 font-display text-[18px] font-semibold text-ink">Créateurs recommandés</h2>
      <p className="mb-4 text-[13px] text-ink-soft">Score calculé à partir des critères de la campagne : une recommandation algorithmique, pas une garantie de performance.</p>
      {recommended.length === 0 ? (
        <div className="card py-10 text-center text-[14px] text-ink-soft">Aucun autre créateur à recommander pour l'instant.</div>
      ) : (
        <div className="space-y-3">
          {recommended.map((s: any) => {
            const profile: any = profileById.get(s.creator_id);
            const creator: any = creatorById.get(s.creator_id);
            return (
              <div key={s.creator_id} className="card flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar name={profile?.full_name} url={profile?.avatar_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{profile?.full_name || "Créateur"}</p>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[12px] font-semibold text-accent">{s.score}% compatible</span>
                  </div>
                  <p className="text-[13px] text-ink-soft">
                    {creator?.country}
                    {creator?.categories?.length ? ` · ${creator.categories.join(", ")}` : ""}
                  </p>
                  <p className="mt-1 text-[12.5px] text-ink-soft">{s.reasoning}</p>
                </div>
                <Link href={`/dashboard/brand/creators/${s.creator_id}?campaign=${campaign.id}`} className="btn-ghost">
                  Voir le profil
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Avatar({ name, url }: { name?: string; url?: string | null }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="h-11 w-11 flex-shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-bg-soft text-[13px] font-semibold text-ink-soft">{initials(name)}</span>
  );
}
