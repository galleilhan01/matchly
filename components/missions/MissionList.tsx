import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatEuros, formatDate, MISSION_STATUS } from "@/lib/format";

export async function MissionList({ role, title, subtitle }: { role: "brand" | "creator"; title: string; subtitle: string }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: missions } = await supabase
    .from("missions")
    .select("id, status, campaign_id, brand_id, creator_id, updated_at")
    .eq(role === "brand" ? "brand_id" : "creator_id", user!.id)
    .order("updated_at", { ascending: false });

  const list = missions ?? [];
  const campaignIds = Array.from(new Set(list.map((m: any) => m.campaign_id)));
  const otherIds = Array.from(new Set(list.map((m: any) => (role === "brand" ? m.creator_id : m.brand_id))));

  const [{ data: campaigns }, { data: others }] = await Promise.all([
    campaignIds.length > 0 ? supabase.from("campaigns").select("id, title, budget_per_video_cents, deadline").in("id", campaignIds) : Promise.resolve({ data: [] as any[] }),
    otherIds.length > 0
      ? role === "brand"
        ? supabase.from("profiles").select("id, full_name").in("id", otherIds)
        : supabase.from("brand_profiles").select("profile_id, company_name").in("profile_id", otherIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const campaignById = new Map((campaigns ?? []).map((c: any) => [c.id, c]));
  const otherName = new Map((others ?? []).map((o: any) => [o.id ?? o.profile_id, o.full_name ?? o.company_name]));

  return (
    <div>
      <h1 className="font-display text-[26px] font-semibold text-ink">{title}</h1>
      <p className="mb-8 mt-1 text-[14.5px] text-ink-soft">{subtitle}</p>

      {list.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-[30px]">🎬</span>
          <p className="text-[15px] font-semibold text-ink">Aucune mission pour l'instant</p>
          <p className="max-w-[380px] text-[13.5px] text-ink-soft">
            {role === "brand" ? "Sélectionnez un créateur dans une de vos campagnes pour démarrer une mission." : "Vos missions apparaîtront ici dès qu'une marque acceptera votre candidature."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((m: any) => {
            const c: any = campaignById.get(m.campaign_id);
            const st = MISSION_STATUS[m.status];
            const needsAction = role === "brand" ? m.status === "video_submitted" : m.status === "accepted" || m.status === "revision_requested";
            return (
              <Link key={m.id} href={`/dashboard/${role}/missions/${m.id}`} className="card flex flex-col gap-3 transition hover:border-accent/40 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15.5px] font-semibold text-ink">{c?.title ?? "Campagne"}</p>
                  <p className="mt-0.5 text-[13px] text-ink-soft">
                    {otherName.get(role === "brand" ? m.creator_id : m.brand_id) || "—"} · {formatEuros(c?.budget_per_video_cents)} · Échéance {formatDate(c?.deadline)}
                  </p>
                </div>
                {needsAction && <span className="w-fit rounded-full bg-accent px-2.5 py-0.5 text-[12px] font-semibold text-white">Action requise</span>}
                <span className={`w-fit rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${st?.className}`}>{st?.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
