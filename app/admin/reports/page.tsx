import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { ReportActions } from "@/components/dashboard/ReportActions";

export default async function AdminReportsPage() {
  const supabase = createClient();
  const { data: reports } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(200);
  const ids = Array.from(new Set((reports ?? []).flatMap((r: any) => [r.reporter_id, r.reported_profile_id]).filter(Boolean)));
  const { data: profiles } = ids.length > 0 ? await supabase.from("profiles").select("id, full_name").in("id", ids as string[]) : { data: [] as any[] };
  const name = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]));

  return (
    <div>
      <h1 className="font-display text-[26px] font-semibold text-ink">Signalements</h1>
      <p className="mb-6 mt-1 text-[14.5px] text-ink-soft">Contenus et comptes signalés par les utilisateurs.</p>
      {!reports || reports.length === 0 ? (
        <div className="card py-12 text-center text-[14px] text-ink-soft">Aucun signalement.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((r: any) => (
            <div key={r.id} className="card">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-[14.5px] text-ink">{r.reason}</p>
                  <p className="mt-1 text-[12.5px] text-ink-soft">
                    Par {name.get(r.reporter_id) || "—"}
                    {r.reported_profile_id ? <> · contre <Link href={`/admin/users?q=${encodeURIComponent(name.get(r.reported_profile_id) || "")}`} className="text-accent">{name.get(r.reported_profile_id) || "—"}</Link></> : null}
                    {" · "}
                    {formatDateTime(r.created_at)}
                  </p>
                </div>
                <ReportActions id={r.id} status={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
