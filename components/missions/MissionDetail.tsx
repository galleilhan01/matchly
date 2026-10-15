import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MissionTimeline } from "@/components/missions/MissionTimeline";
import { MissionActions } from "@/components/missions/MissionActions";
import { OpenConversationButton } from "@/components/messages/OpenConversationButton";
import { formatEuros, formatDate, MISSION_STATUS } from "@/lib/format";

export async function MissionDetail({ id, role }: { id: string; role: "brand" | "creator" }) {
  const supabase = createClient();

  const { data: mission } = await supabase.from("missions").select("*").eq("id", id).single();
  if (!mission) notFound();

  const [{ data: campaign }, { data: events }, { data: review }, { data: brand }, { data: creator }] = await Promise.all([
    supabase.from("campaigns").select("title, budget_per_video_cents, deadline, deliverables").eq("id", mission.campaign_id).single(),
    supabase.from("mission_events").select("*").eq("mission_id", id).order("created_at", { ascending: true }),
    supabase.from("reviews").select("id").eq("mission_id", id).maybeSingle(),
    supabase.from("brand_profiles").select("company_name").eq("profile_id", mission.brand_id).single(),
    supabase.from("profiles").select("full_name").eq("id", mission.creator_id).single(),
  ]);

  const st = MISSION_STATUS[mission.status];
  const otherName = role === "brand" ? creator?.full_name : brand?.company_name;
  const backHref = role === "brand" ? "/dashboard/brand/deliverables" : "/dashboard/creator/missions";

  return (
    <div className="mx-auto max-w-[900px]">
      <Link href={backHref} className="mb-4 inline-block text-[13.5px] font-medium text-ink-soft hover:text-ink">
        ← Retour
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${st?.className}`}>{st?.label}</span>
          <h1 className="mt-2 font-display text-[24px] font-semibold text-ink">{campaign?.title}</h1>
          <p className="mt-1 text-[14px] text-ink-soft">
            {role === "brand" ? "Créateur" : "Marque"} : {otherName || "—"} · {formatEuros(campaign?.budget_per_video_cents)} · Échéance {formatDate(campaign?.deadline)}
          </p>
        </div>
        <OpenConversationButton brandId={mission.brand_id} creatorId={mission.creator_id} campaignId={mission.campaign_id} role={role} />
      </div>

      {campaign?.deliverables && (
        <div className="card mb-6">
          <p className="mb-1 text-[13px] font-semibold text-ink-soft">Livrable attendu</p>
          <p className="text-[14.5px] text-ink">{campaign.deliverables}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="order-2 md:order-1">
          <MissionActions role={role} mission={mission} hasReview={!!review} />
        </div>
        <div className="card order-1 h-fit md:order-2">
          <p className="mb-4 text-[14px] font-semibold text-ink">Avancement</p>
          <MissionTimeline status={mission.status} events={events ?? []} />
        </div>
      </div>
    </div>
  );
}
