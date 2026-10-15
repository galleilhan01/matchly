import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, APPLICATION_STATUS } from "@/lib/format";
import { WithdrawButton } from "@/components/dashboard/WithdrawButton";

export default async function CreatorApplicationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: applications } = await supabase
    .from("applications")
    .select("id, status, message, created_at, campaign_id")
    .eq("creator_id", user!.id)
    .order("created_at", { ascending: false });

  const ids = (applications ?? []).map((a: any) => a.campaign_id);
  const { data: campaigns } = ids.length > 0 ? await supabase.from("campaigns").select("id, title, deadline").in("id", ids) : { data: [] as any[] };
  const byId = new Map((campaigns ?? []).map((c: any) => [c.id, c]));

  return (
    <div>
      <h1 className="font-display text-[26px] font-semibold text-ink">Mes candidatures</h1>
      <p className="mb-8 mt-1 text-[14.5px] text-ink-soft">Suivez l'état de vos candidatures.</p>

      {!applications || applications.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-[30px]">📝</span>
          <p className="text-[15px] font-semibold text-ink">Vous n'avez encore postulé à aucune campagne</p>
          <Link href="/dashboard/creator/campaigns" className="btn-primary mt-1">
            Découvrir les campagnes
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((a: any) => {
            const c: any = byId.get(a.campaign_id);
            const st = APPLICATION_STATUS[a.status];
            return (
              <div key={a.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <Link href={`/dashboard/creator/campaigns/${a.campaign_id}`} className="truncate text-[15.5px] font-semibold text-ink hover:text-accent">
                    {c?.title ?? "Campagne"}
                  </Link>
                  <p className="mt-0.5 text-[12.5px] text-ink-soft">Envoyée le {formatDate(a.created_at)}</p>
                </div>
                <span className={`w-fit rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${st?.className}`}>{st?.label}</span>
                {a.status === "pending" && <WithdrawButton applicationId={a.id} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
