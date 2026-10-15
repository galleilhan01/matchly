"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { CONTENT_TYPE_LABELS, PLATFORM_LABELS, initials } from "@/lib/format";

const CATEGORIES = ["Mode", "Beauté", "Tech", "Alimentation", "Sport", "Lifestyle", "Gaming", "Voyage", "Maison", "Santé"];
const PLATFORMS = ["tiktok", "instagram", "youtube"];

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function CreatorProfileForm({ userId, profile, creator, socials, portfolio }: { userId: string; profile: any; creator: any; socials: any[]; portfolio: any[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState<string>(profile?.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [bio, setBio] = useState<string>(creator?.bio ?? "");
  const [country, setCountry] = useState<string>(creator?.country ?? "");
  const [city, setCity] = useState<string>(creator?.city ?? "");
  const [age, setAge] = useState<string>(creator?.age ? String(creator.age) : "");
  const [languages, setLanguages] = useState<string>((creator?.languages ?? []).join(", "));
  const [audience, setAudience] = useState<string>(creator?.audience ?? "");
  const [rate, setRate] = useState<string>(creator?.base_rate_cents ? String(creator.base_rate_cents / 100) : "");
  const [categories, setCategories] = useState<string[]>(creator?.categories ?? []);
  const [contentTypes, setContentTypes] = useState<string[]>(creator?.content_types ?? []);
  const [socialState, setSocialState] = useState<Record<string, { handle: string; followers: string; engagement: string; views: string }>>(
    Object.fromEntries(
      PLATFORMS.map((p) => {
        const s = socials.find((x) => x.platform === p);
        return [p, { handle: s?.handle ?? "", followers: s?.followers ? String(s.followers) : "", engagement: s?.avg_engagement_rate ? String(s.avg_engagement_rate) : "", views: s?.avg_views ? String(s.avg_views) : "" }];
      })
    )
  );
  const [items, setItems] = useState<any[]>(portfolio);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function uploadAvatar(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("La photo doit être une image.");
    if (file.size > 5 * 1024 * 1024) return setError("Photo trop lourde (5 Mo maximum).");
    setUploading("avatar");
    setError(null);
    const path = `${userId}/avatar-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
    if (upErr) {
      setUploading(null);
      return setError("Échec de l'envoi de la photo : " + upErr.message);
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", userId);
    setUploading(null);
  }

  async function uploadPortfolio(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("video/")) return setError("Le portfolio accepte uniquement des vidéos.");
    if (file.size > 50 * 1024 * 1024) return setError("Vidéo trop lourde (50 Mo maximum).");
    setUploading("portfolio");
    setError(null);
    const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("portfolio").upload(path, file, { contentType: file.type });
    if (upErr) {
      setUploading(null);
      return setError("Échec de l'envoi de la vidéo : " + upErr.message);
    }
    const { data: pub } = supabase.storage.from("portfolio").getPublicUrl(path);
    const { data, error: insErr } = await supabase.from("portfolio_items").insert({ creator_id: userId, video_url: pub.publicUrl }).select("*").single();
    setUploading(null);
    if (insErr) return setError(insErr.message);
    setItems((prev) => [data, ...prev]);
  }

  async function removePortfolio(item: any) {
    if (!confirm("Supprimer cette vidéo du portfolio ?")) return;
    await supabase.from("portfolio_items").delete().eq("id", item.id);
    const marker = "/portfolio/";
    const idx = item.video_url.indexOf(marker);
    if (idx !== -1) await supabase.storage.from("portfolio").remove([item.video_url.slice(idx + marker.length)]);
    setItems((prev) => prev.filter((x) => x.id !== item.id));
  }

  async function save() {
    setError(null);
    setSaved(false);
    if (fullName.trim().length < 2) return setError("Indiquez votre nom.");
    const ageNum = age ? Number(age) : null;
    if (ageNum != null && (ageNum < 13 || ageNum > 100)) return setError("Âge invalide.");

    setSaving(true);
    try {
      const r1 = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", userId);
      if (r1.error) throw r1.error;

      const r2 = await supabase
        .from("creator_profiles")
        .update({
          bio: bio.trim() || null,
          country: country.trim() || null,
          city: city.trim() || null,
          age: ageNum,
          languages: languages.split(",").map((l) => l.trim().toLowerCase()).filter(Boolean),
          audience: audience.trim() || null,
          base_rate_cents: rate ? Math.round(Number(rate) * 100) : null,
          categories,
          content_types: contentTypes,
        })
        .eq("profile_id", userId);
      if (r2.error) throw r2.error;

      for (const p of PLATFORMS) {
        const s = socialState[p];
        if (s.handle.trim()) {
          const r = await supabase.from("creator_socials").upsert(
            {
              creator_id: userId,
              platform: p,
              handle: s.handle.trim(),
              followers: Number(s.followers) || 0,
              avg_engagement_rate: Number(s.engagement) || 0,
              avg_views: Number(s.views) || 0,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "creator_id,platform" }
          );
          if (r.error) throw r.error;
        } else {
          await supabase.from("creator_socials").delete().eq("creator_id", userId).eq("platform", p);
        }
      }

      setSaved(true);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-2 text-[13.5px] font-medium transition ${active ? "border-accent bg-accent/10 text-accent" : "border-line text-ink-soft hover:bg-bg-soft"}`;

  return (
    <div className="mx-auto max-w-[720px]">
      <Link href="/dashboard/creator/profile" className="mb-4 inline-block text-[13.5px] font-medium text-ink-soft hover:text-ink">
        ← Retour au profil
      </Link>
      <h1 className="mb-6 font-display text-[24px] font-semibold text-ink">Modifier mon profil</h1>

      <div className="card mb-5 flex items-center gap-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-soft text-[22px] font-semibold text-ink-soft">{initials(fullName)}</span>
        )}
        <label className="btn-ghost cursor-pointer">
          {uploading === "avatar" ? "Envoi…" : "Changer la photo"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadAvatar(e.target.files?.[0] ?? null)} />
        </label>
      </div>

      <div className="card mb-5 space-y-4">
        <FormField id="fullName" label="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <div>
          <label htmlFor="bio" className="mb-2 block text-[14px] font-medium text-ink">Bio</label>
          <textarea id="bio" className="input min-h-[90px] resize-none" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={400} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField id="country" label="Pays" value={country} onChange={(e) => setCountry(e.target.value)} />
          <FormField id="city" label="Ville" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField id="age" type="number" label="Âge" value={age} onChange={(e) => setAge(e.target.value)} />
          <FormField id="languages" label="Langues (séparées par des virgules)" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="fr, en" />
        </div>
        <FormField id="audience" label="Votre audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Ex : 70 % de femmes, 18-24 ans, France" />
        <FormField id="rate" type="number" label="Tarif indicatif par vidéo (€)" value={rate} onChange={(e) => setRate(e.target.value)} />
      </div>

      <div className="card mb-5">
        <p className="mb-3 text-[14px] font-medium text-ink">Catégories</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button type="button" key={c} onClick={() => setCategories(toggle(categories, c))} className={chip(categories.includes(c))}>
              {c}
            </button>
          ))}
        </div>
        <p className="mb-3 mt-5 text-[14px] font-medium text-ink">Types de contenu</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
            <button type="button" key={value} onClick={() => setContentTypes(toggle(contentTypes, value))} className={chip(contentTypes.includes(value))}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card mb-5">
        <p className="mb-1 text-[14px] font-medium text-ink">Réseaux sociaux et statistiques</p>
        <p className="mb-4 text-[12.5px] text-ink-soft">Statistiques déclaratives : indiquez des chiffres exacts, les marques peuvent les vérifier.</p>
        <div className="space-y-5">
          {PLATFORMS.map((p) => (
            <div key={p}>
              <p className="mb-2 text-[13.5px] font-semibold text-ink">{PLATFORM_LABELS[p]}</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <input className="input" placeholder="@pseudo" value={socialState[p].handle} onChange={(e) => setSocialState({ ...socialState, [p]: { ...socialState[p], handle: e.target.value } })} />
                <input className="input" type="number" placeholder="Abonnés" value={socialState[p].followers} onChange={(e) => setSocialState({ ...socialState, [p]: { ...socialState[p], followers: e.target.value } })} />
                <input className="input" type="number" step="0.1" placeholder="Engagement %" value={socialState[p].engagement} onChange={(e) => setSocialState({ ...socialState, [p]: { ...socialState[p], engagement: e.target.value } })} />
                <input className="input" type="number" placeholder="Vues moy." value={socialState[p].views} onChange={(e) => setSocialState({ ...socialState, [p]: { ...socialState[p], views: e.target.value } })} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mb-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[14px] font-medium text-ink">Portfolio (vidéos)</p>
          <label className="btn-ghost cursor-pointer !px-3.5 !py-2 text-[13.5px]">
            {uploading === "portfolio" ? "Envoi…" : "+ Ajouter une vidéo"}
            <input type="file" accept="video/*" className="hidden" onChange={(e) => uploadPortfolio(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        {items.length === 0 ? (
          <p className="text-[13.5px] text-ink-soft">Ajoutez quelques vidéos pour montrer votre style aux marques.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="relative">
                <video src={item.video_url} controls preload="metadata" className="aspect-[9/16] w-full rounded-[10px] bg-black object-cover" />
                <button type="button" onClick={() => removePortfolio(item)} className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[12px] text-white">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">{error}</div>}
      {saved && <div className="mb-4 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">Profil enregistré ✓</div>}

      <Button type="button" onClick={save} loading={saving} className="w-full">
        Enregistrer
      </Button>
    </div>
  );
}
