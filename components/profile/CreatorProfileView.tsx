import { createClient } from "@/lib/supabase/server";
import { formatCount, formatEuros, formatDate, CONTENT_TYPE_LABELS, PLATFORM_LABELS, initials } from "@/lib/format";

export async function CreatorProfileView({ creatorId }: { creatorId: string }) {
  const supabase = createClient();

  const [{ data: profile }, { data: creator }, { data: socials }, { data: portfolio }, { data: reviews }] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url, is_verified").eq("id", creatorId).single(),
    supabase.from("creator_profiles").select("*").eq("profile_id", creatorId).single(),
    supabase.from("creator_socials").select("*").eq("creator_id", creatorId),
    supabase.from("portfolio_items").select("*").eq("creator_id", creatorId).order("created_at", { ascending: false }),
    supabase.from("reviews").select("rating, comment, created_at, brand_id").eq("creator_id", creatorId).order("created_at", { ascending: false }).limit(5),
  ]);

  if (!profile || !creator) return <div className="card py-12 text-center text-ink-soft">Profil introuvable.</div>;

  const brandIds = Array.from(new Set((reviews ?? []).map((r: any) => r.brand_id)));
  const { data: brands } = brandIds.length > 0 ? await supabase.from("brand_profiles").select("profile_id, company_name").in("profile_id", brandIds) : { data: [] as any[] };
  const brandName = new Map((brands ?? []).map((b: any) => [b.profile_id, b.company_name]));

  const followers = (socials ?? []).reduce((s: number, x: any) => s + (x.followers ?? 0), 0);
  const eng = (socials ?? []).map((x: any) => Number(x.avg_engagement_rate ?? 0)).filter((v: number) => v > 0);
  const engagement = eng.length ? eng.reduce((a: number, b: number) => a + b, 0) / eng.length : 0;
  const avgViews = (socials ?? []).reduce((s: number, x: any) => s + (x.avg_views ?? 0), 0);
  const avgRating = reviews && reviews.length ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : null;

  return (
    <div>
      <div className="card mb-6 flex flex-col gap-5 sm:flex-row sm:items-center">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="h-24 w-24 flex-shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-bg-soft text-[26px] font-semibold text-ink-soft">{initials(profile.full_name)}</span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 font-display text-[24px] font-semibold text-ink">
            {profile.full_name}
            {profile.is_verified && <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[12px] font-semibold text-accent">✔ Vérifié</span>}
          </h1>
          <p className="mt-1 text-[14px] text-ink-soft">
            {[creator.city, creator.country].filter(Boolean).join(", ") || "Localisation non renseignée"}
            {creator.age ? ` · ${creator.age} ans` : ""}
            {creator.languages?.length ? ` · ${creator.languages.join(", ")}` : ""}
          </p>
          {creator.bio && <p className="mt-3 text-[14.5px] text-ink">{creator.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(creator.categories ?? []).map((c: string) => (
              <span key={c} className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[12.5px] font-medium text-accent">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Followers" value={formatCount(followers)} />
        <Stat label="Engagement moyen" value={engagement ? engagement.toFixed(1) + " %" : "—"} />
        <Stat label="Vues moyennes" value={avgViews ? formatCount(avgViews) : "—"} />
        <Stat label="Tarif indicatif" value={creator.base_rate_cents ? formatEuros(creator.base_rate_cents) + " / vidéo" : "—"} />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="card">
          <p className="mb-3 text-[14px] font-semibold text-ink">Réseaux sociaux</p>
          {!socials || socials.length === 0 ? (
            <p className="text-[13.5px] text-ink-soft">Aucun réseau renseigné.</p>
          ) : (
            <div className="space-y-3">
              {socials.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-[13.5px]">
                  <div>
                    <p className="font-medium text-ink">{PLATFORM_LABELS[s.platform]}</p>
                    <p className="text-ink-soft">{s.handle}</p>
                  </div>
                  <div className="text-right text-ink-soft">
                    <p>{formatCount(s.followers)} followers</p>
                    <p>{Number(s.avg_engagement_rate) ? Number(s.avg_engagement_rate).toFixed(1) + " % engagement" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <p className="mb-3 text-[14px] font-semibold text-ink">Contenus & audience</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(creator.content_types ?? []).length === 0 && <span className="text-[13.5px] text-ink-soft">Types de contenu non renseignés.</span>}
            {(creator.content_types ?? []).map((t: string) => (
              <span key={t} className="rounded-full border border-line px-2.5 py-0.5 text-[12.5px] text-ink-soft">
                {CONTENT_TYPE_LABELS[t]}
              </span>
            ))}
          </div>
          <p className="text-[13.5px] text-ink-soft">{creator.audience ? `Audience : ${creator.audience}` : "Audience non renseignée."}</p>
          <p className="mt-3 text-[12px] text-ink-soft">Statistiques déclaratives, renseignées par le créateur.</p>
        </div>
      </div>

      <div className="card mb-6">
        <p className="mb-3 text-[14px] font-semibold text-ink">Portfolio</p>
        {!portfolio || portfolio.length === 0 ? (
          <p className="text-[13.5px] text-ink-soft">Aucune vidéo dans le portfolio pour l'instant.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {portfolio.map((p: any) => (
              <video key={p.id} src={p.video_url} controls preload="metadata" className="aspect-[9/16] w-full rounded-[10px] bg-black object-cover" />
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <p className="mb-3 text-[14px] font-semibold text-ink">
          Avis des marques {avgRating ? `· ★ ${avgRating.toFixed(1)} (${reviews!.length})` : ""}
        </p>
        {!reviews || reviews.length === 0 ? (
          <p className="text-[13.5px] text-ink-soft">Pas encore d'avis.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r: any, i: number) => (
              <div key={i} className="border-b border-line pb-3 last:border-0 last:pb-0">
                <p className="text-[13.5px] text-amber-500">{"★".repeat(r.rating)}<span className="text-line">{"★".repeat(5 - r.rating)}</span></p>
                {r.comment && <p className="mt-1 text-[14px] text-ink">{r.comment}</p>}
                <p className="mt-1 text-[12px] text-ink-soft">
                  {brandName.get(r.brand_id) || "Marque"} · {formatDate(r.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-[12.5px] text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-[20px] font-semibold text-ink">{value}</p>
    </div>
  );
}
