import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminUserActions } from "@/components/dashboard/AdminUserActions";
import { formatDate } from "@/lib/format";

const TABS = [
  { key: "", label: "Tous" },
  { key: "brand", label: "Marques" },
  { key: "creator", label: "Créateurs" },
];

export default async function AdminUsersPage({ searchParams }: { searchParams: { type?: string; q?: string } }) {
  const supabase = createClient();
  let query = supabase.from("profiles").select("id, full_name, account_type, is_verified, is_suspended, created_at").neq("account_type", "admin").order("created_at", { ascending: false }).limit(200);
  if (searchParams.type === "brand" || searchParams.type === "creator") query = query.eq("account_type", searchParams.type);
  if (searchParams.q) query = query.ilike("full_name", `%${searchParams.q}%`);
  const { data: users } = await query;

  const brandIds = (users ?? []).filter((u: any) => u.account_type === "brand").map((u: any) => u.id);
  const { data: brands } = brandIds.length > 0 ? await supabase.from("brand_profiles").select("profile_id, company_name").in("profile_id", brandIds) : { data: [] as any[] };
  const company = new Map<string, any>((brands ?? []).map((b: any) => [b.profile_id, b.company_name] as [string, any]));

  return (
    <div>
      <h1 className="font-display text-[26px] font-semibold text-ink">Utilisateurs</h1>
      <div className="mb-6 mt-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/admin/users?type=${t.key}` : "/admin/users"}
            className={`rounded-full border px-3.5 py-1.5 text-[13.5px] font-medium ${(searchParams.type ?? "") === t.key ? "border-accent bg-accent/10 text-accent" : "border-line text-ink-soft"}`}
          >
            {t.label}
          </Link>
        ))}
        <form className="ml-auto" method="get">
          {searchParams.type && <input type="hidden" name="type" value={searchParams.type} />}
          <input name="q" defaultValue={searchParams.q} placeholder="Rechercher un nom…" className="input !py-1.5 text-[13.5px]" />
        </form>
      </div>

      {!users || users.length === 0 ? (
        <div className="card py-12 text-center text-[14px] text-ink-soft">Aucun utilisateur.</div>
      ) : (
        <div className="space-y-3">
          {users.map((u: any) => (
            <div key={u.id} className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-ink">
                  {u.full_name || "(sans nom)"}
                  {company.get(u.id) ? <span className="font-normal text-ink-soft">· {company.get(u.id)}</span> : null}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-soft">
                  <span>{u.account_type === "brand" ? "Marque" : "Créateur"}</span>
                  <span>· inscrit le {formatDate(u.created_at)}</span>
                  {u.is_verified && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">Vérifié</span>}
                  {u.is_suspended && <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">Suspendu</span>}
                </p>
              </div>
              <AdminUserActions id={u.id} verified={u.is_verified} suspended={u.is_suspended} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
