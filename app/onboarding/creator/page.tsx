"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import type { ContentType, Platform } from "@/types/database";

const CATEGORIES = ["Mode", "Beauté", "Tech", "Alimentation", "Sport", "Lifestyle", "Gaming", "Voyage"];
const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "ugc", label: "UGC" },
  { value: "face_camera", label: "Face caméra" },
  { value: "voice_over", label: "Voice-over" },
  { value: "unboxing", label: "Unboxing" },
  { value: "product_test", label: "Test produit" },
  { value: "lifestyle", label: "Lifestyle" },
];
const PLATFORMS: Platform[] = ["tiktok", "instagram", "youtube"];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function CreatorOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [country, setCountry] = useState("France");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [socials, setSocials] = useState<Record<Platform, { handle: string; followers: string }>>({
    tiktok: { handle: "", followers: "" },
    instagram: { handle: "", followers: "" },
    youtube: { handle: "", followers: "" },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (categories.length === 0) return setError("Sélectionnez au moins une catégorie.");
    if (contentTypes.length === 0) return setError("Sélectionnez au moins un type de contenu.");

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée, reconnectez-vous.");

      const { error: profileError } = await supabase
        .from("creator_profiles")
        .update({ country, city: city.trim() || null, bio: bio.trim() || null, categories, content_types: contentTypes })
        .eq("profile_id", user.id);
      if (profileError) throw profileError;

      const socialRows = PLATFORMS.filter((p) => socials[p].handle.trim()).map((p) => ({
        creator_id: user.id,
        platform: p,
        handle: socials[p].handle.trim(),
        followers: Number(socials[p].followers) || 0,
      }));

      if (socialRows.length > 0) {
        const { error: socialsError } = await supabase.from("creator_socials").upsert(socialRows);
        if (socialsError) throw socialsError;
      }

      router.push("/dashboard/creator");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-soft px-6 py-12">
      <div className="w-full max-w-[560px] card">
        <div className="mb-6 flex items-center gap-2 text-[13px] font-medium text-ink-soft">
          <span className="h-1.5 w-8 rounded-full bg-accent" />
          <span className="h-1.5 w-8 rounded-full bg-line" />
          Étape 1 sur 2
        </div>
        <h1 className="font-display text-[24px] font-semibold text-ink">Complétez votre profil créateur</h1>
        <p className="mt-1 mb-6 text-[14.5px] text-ink-soft">
          Ces informations servent au calcul du score de compatibilité IA avec les campagnes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <FormField id="country" label="Pays" value={country} onChange={(e) => setCountry(e.target.value)} />
            <FormField id="city" label="Ville (optionnel)" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          <div>
            <label htmlFor="bio" className="mb-2 block text-[14px] font-medium text-ink">Bio courte</label>
            <textarea
              id="bio"
              className="input min-h-[80px] resize-none"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Décrivez votre style de contenu en une phrase."
              maxLength={280}
            />
          </div>

          <div>
            <label className="mb-2 block text-[14px] font-medium text-ink">Catégories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategories(toggle(categories, c))}
                  className={`rounded-full border px-3.5 py-2 text-[13.5px] font-medium transition ${
                    categories.includes(c) ? "border-accent bg-accent/10 text-accent" : "border-line text-ink-soft hover:bg-bg-soft"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[14px] font-medium text-ink">Types de contenu que vous savez produire</label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setContentTypes(toggle(contentTypes, c.value))}
                  className={`rounded-full border px-3.5 py-2 text-[13.5px] font-medium transition ${
                    contentTypes.includes(c.value) ? "border-accent bg-accent/10 text-accent" : "border-line text-ink-soft hover:bg-bg-soft"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[14px] font-medium text-ink">Réseaux sociaux (au moins un recommandé)</label>
            <div className="space-y-2.5">
              {PLATFORMS.map((p) => (
                <div key={p} className="flex gap-2">
                  <span className="input flex w-32 flex-shrink-0 items-center capitalize text-ink-soft">{p}</span>
                  <input
                    className="input"
                    placeholder="@pseudo"
                    value={socials[p].handle}
                    onChange={(e) => setSocials({ ...socials, [p]: { ...socials[p], handle: e.target.value } })}
                  />
                  <input
                    className="input w-36"
                    type="number"
                    min={0}
                    placeholder="Abonnés"
                    value={socials[p].followers}
                    onChange={(e) => setSocials({ ...socials, [p]: { ...socials[p], followers: e.target.value } })}
                  />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Continuer
          </Button>
        </form>
      </div>
    </div>
  );
}
