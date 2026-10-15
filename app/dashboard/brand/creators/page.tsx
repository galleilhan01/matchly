import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreatorCard } from "@/components/profile/CreatorCard";
import { CONTENT_TYPE_LABELS, PLATFORM_LABELS } from "@/lib/format";

const PAGE_SIZE = 18;

type Params = Record<string, string | undefined>;

export default async function FindCreatorsPage({ searchParams }: { searchParams: Params }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sp = searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ data: creators }, { data: profiles }, { data: socials }, { data: myCampaigns }] = await Promise.all([
    supabase.from("creator_profiles").select("*"),
    supabase.from("profiles").select("id, full_name, avatar_url, is_verified, is_suspended").eq("account_type", "creator"),
    supabase.from("creator_socials").select("*"),
    supabase.from("campaigns").select("id, title").eq("brand_id", user!.id).order("created_at", { ascending: false }),
  ]);

  const { data: scores } = sp.campaign ? await supabase.rpc("get_campaign_scores", { p_campaign_id: sp.campaign }) : { data: [] as any[] };
  const scoreById = new Map<string, any>((scores ?? []).map((s: any) => [s.creator_id, s.score] as [string, any]));

  const profileById = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p] as [string, any]));
  const socialsByCreator = new Map<string, any[]>();
  (socials ?? []).forEach((s: any) => socialsByCreator.set(s.creator_id, [...(socialsByCreator.get(s.creator_id) ?? []), s]));

  const q = (sp.q || "").trim().toLowerCase();
  const minFollowers = Number(sp.min_followers) || 0;
  const maxFollowers = Number(sp.max_followers) || Infinity;
  const minEngagement = Number(sp.min_engagement) || 0;
  const maxRate = sp.max_rate ? Number(sp.max_rate) * 100 : Infinity;
  const ageMin = Number(sp.age_min) || 0;
  const ageMax = Number(sp.age_max) || 200;

  let list = (creators ?? []).filter((c: any) => {
    const p: any = profileById.get(c.profile_id);
    if (!p || p.is_suspended) return false;
    const s = socialsByCreator.get(c.profile_id) ?? [];
    const relevant = sp.platform ? s.filter((x: any) => x.platform === sp.platform) : s;
    if (sp.platform && relevant.length === 0) return false;
    const followers = relevant.reduce((sum: number, x: any) => sum + (x.followers ?? 0), 0);
    const engagement = Math.max(0, ...relevant.map((x: any) => Number(x.avg_engagement_rate ?? 0)));
    if (followers < minFollowers || followers > maxFollowers) return false;
    if (engagement < minEngagement) return false;
    if (q && !(p.full_name || "").toLowerCase().includes(q)) return false;
    if (sp.country && !(c.country || "").toLowerCase().includes(sp.country.toLowerCase())) return false;
    if (sp.niche && !(c.categories ?? []).some((cat: string) => cat.toLowerCase().includes(sp.niche!.toLowerCase()))) return false;
    if (sp.content_type && !(c.content_types ?? []).includes(sp.content_type)) return false;
    if (sp.language && !(c.languages ?? []).some((l: string) => l.toLowerCase() === sp.language!.toLowerCase())) return false;
    if (c.base_rate_cents != null && c.base_rate_cents > maxRate) return false;
    if ((sp.age_min || sp.age_max) && (c.age == null || c.age < ageMin || c.age > ageMax)) return false;
    return true;
  });

  if (sp.campaign) list = list.sort((a: any, b: any) => (scoreById.get(b.profile_id) ?? 0) - (scoreById.get(a.profile_id) ?? 0));

  const total = list.length;
  const pageItems = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const qs = (overrides: Params) => {
    const merged: Params = { ...sp, ...overrides };
    const str = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
      .join("&");
    return str ? `?${str}` : "";
  };

  return (
    <div>
      <h1 className="font-display text-[26px] font-semibold text-ink">Trouver des créateurs</h1>
      <p className="mb-6 mt-1 text-[14.5px] text-ink-soft">Filtrez, comparez et contactez les créateurs qui correspondent à vos campagnes.</p>

      <form method="get" className="card mb-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Recherche" name="q" defaultValue={sp.q} placeholder="Nom du créateur" />
          <Select label="Plateforme" name="platform" defaultValue={sp.platform} options={Object.entries(PLATFORM_LABELS)} />
          <Field label="Pays" name="country" defaultValue={sp.country} placeholder="France" />
          <Field label="Niche" name="niche" defaultValue={sp.niche} placeholder="Mode, Beauté…" />
          <Select label="Type de contenu" name="content_type" defaultValue={sp.content_type} options={Object.entries(CONTENT_TYPE_LABELS)} />
          <Field label="Langue" name="language" defaultValue={sp.language} placeholder="fr" />
          <Field label="Âge min" name="age_min" type="number" defaultValue={sp.age_min} />
          <Field label="Âge max" name="age_max" type="number" defaultValue={sp.age_max} />
          <Field label="Followers min" name="min_followers" type="number" defaultValue={sp.min_followers} />
          <Field label="Followers max" name="max_followers" type="number" defaultValue={sp.max_followers} />
          <Field label="Engagement min (%)" name="min_engagement" type="number" defaultValue={sp.min_engagement} />
          <Field label="Budget max / vidéo (€)" name="max_rate" type="number" defaultValue={sp.max_rate} />
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-[12.5px] text-ink-soft">Score de compatibilité pour la campagne</label>
            <select name="campaign" defaultValue={sp.campaign ?? ""} className="input !py-2 text-[14px]">
              <option value="">Aucune campagne sélectionnée</option>
              {(myCampaigns ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Appliquer les filtres
          </button>
          <Link href="/dashboard/brand/creators" className="btn-ghost">
            Réinitialiser
          </Link>
        </div>
      </form>

      <p className="mb-4 text-[13.5px] text-ink-soft">
        {total} créateur{total > 1 ? "s" : ""}
        {sp.campaign ? " · triés par compatibilité (recommandation algorithmique)" : ""}
      </p>

      {pageItems.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-[30px]">🔍</span>
          <p className="text-[15px] font-semibold text-ink">Aucun créateur ne correspond à ces filtres</p>
          <p className="text-[13.5px] text-ink-soft">Essayez d'élargir votre recherche.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((c: any) => (
            <CreatorCard
              key={c.profile_id}
              creator={c}
              profile={profileById.get(c.profile_id)}
              socials={socialsByCreator.get(c.profile_id) ?? []}
              score={sp.campaign ? (scoreById.get(c.profile_id) as number | undefined) : undefined}
              campaignId={sp.campaign}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4 text-[14px]">
          {page > 1 ? (
            <Link href={`/dashboard/brand/creators${qs({ page: String(page - 1) })}`} className="btn-ghost">
              ← Précédent
            </Link>
          ) : <span />}
          <span className="text-ink-soft">
            Page {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={`/dashboard/brand/creators${qs({ page: String(page + 1) })}`} className="btn-ghost">
              Suivant →
            </Link>
          ) : <span />}
        </div>
      )}
    </div>
  );
}

function Field({ label, name, defaultValue, placeholder, type = "text" }: { label: string; name: string; defaultValue?: string; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-[12.5px] text-ink-soft">{label}</label>
      <input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} className="input !py-2 text-[14px]" />
    </div>
  );
}

function Select({ label, name, defaultValue, options }: { label: string; name: string; defaultValue?: string; options: [string, string][] }) {
  return (
    <div>
      <label className="mb-1 block text-[12.5px] text-ink-soft">{label}</label>
      <select name={name} defaultValue={defaultValue ?? ""} className="input !py-2 text-[14px]">
        <option value="">Tous</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}
