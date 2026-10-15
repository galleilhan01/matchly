import Link from "next/link";
import { formatCount, CONTENT_TYPE_LABELS, PLATFORM_LABELS, initials } from "@/lib/format";

export function CreatorCard({
  creator,
  profile,
  socials,
  score,
  campaignId,
}: {
  creator: any;
  profile: any;
  socials: any[];
  score?: number;
  campaignId?: string;
}) {
  const followers = socials.reduce((s: number, x: any) => s + (x.followers ?? 0), 0);
  const engagementValues = socials.map((x: any) => Number(x.avg_engagement_rate ?? 0)).filter((v: number) => v > 0);
  const engagement = engagementValues.length ? engagementValues.reduce((a: number, b: number) => a + b, 0) / engagementValues.length : 0;
  const href = `/dashboard/brand/creators/${creator.profile_id}${campaignId ? `?campaign=${campaignId}` : ""}`;

  return (
    <div className="card flex flex-col">
      <div className="mb-4 flex items-start gap-3">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="h-14 w-14 flex-shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-bg-soft text-[15px] font-semibold text-ink-soft">{initials(profile?.full_name)}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-[15.5px] font-semibold text-ink">
            {profile?.full_name || "Créateur"}
            {profile?.is_verified && <span title="Profil vérifié" className="text-[13px] text-accent">✔</span>}
          </p>
          <p className="truncate text-[13px] text-ink-soft">{creator.categories?.join(", ") || "Catégorie non renseignée"}</p>
          {creator.country && <p className="text-[12.5px] text-ink-soft">📍 {creator.country}</p>}
        </div>
        {score != null && <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[12px] font-semibold text-accent">{score}%</span>}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 rounded-[10px] bg-bg-soft p-3">
        <div>
          <p className="text-[11.5px] text-ink-soft">Followers</p>
          <p className="text-[15px] font-semibold text-ink">{formatCount(followers)}</p>
        </div>
        <div>
          <p className="text-[11.5px] text-ink-soft">Engagement</p>
          <p className="text-[15px] font-semibold text-ink">{engagement ? engagement.toFixed(1) + " %" : "—"}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {socials.map((s: any) => (
          <span key={s.platform} className="rounded-full border border-line px-2.5 py-0.5 text-[12px] text-ink-soft">
            {PLATFORM_LABELS[s.platform]}
          </span>
        ))}
        {(creator.content_types ?? []).slice(0, 3).map((t: string) => (
          <span key={t} className="rounded-full bg-bg-soft px-2.5 py-0.5 text-[12px] text-ink-soft">
            {CONTENT_TYPE_LABELS[t]}
          </span>
        ))}
      </div>

      <Link href={href} className="btn-ghost mt-auto">
        Voir le profil
      </Link>
    </div>
  );
}
