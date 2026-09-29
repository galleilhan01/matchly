"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

type Platform = "tiktok" | "instagram" | "youtube" | "";
type ContentType = "ugc" | "face_camera" | "voice_over" | "unboxing" | "product_test" | "lifestyle" | "other" | "";

interface CampaignForm {
  title: string;
  platform: Platform;
  content_type: ContentType;
  niche: string;
  country: string;
  language: string;
  target_age_min: string;
  target_age_max: string;
  creators_needed: string;
  budget_per_video: string; // en euros, converti en centimes à la publication
  deliverables: string;
  deadline: string;
}

const EMPTY_FORM: CampaignForm = {
  title: "",
  platform: "",
  content_type: "",
  niche: "",
  country: "France",
  language: "fr",
  target_age_min: "",
  target_age_max: "",
  creators_needed: "1",
  budget_per_video: "",
  deliverables: "",
  deadline: "",
};

const STEPS = [
  "Que voulez-vous promouvoir ?",
  "Quel contenu recherchez-vous ?",
  "Quel type de créateur recherchez-vous ?",
  "Quel est votre budget ?",
  "Deadline",
  "Résumé",
];

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
];

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "ugc", label: "UGC" },
  { value: "face_camera", label: "Face caméra" },
  { value: "voice_over", label: "Voice-over" },
  { value: "unboxing", label: "Unboxing" },
  { value: "product_test", label: "Test produit" },
  { value: "lifestyle", label: "Lifestyle" },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM);
  const [brief, setBrief] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiUsed, setAiUsed] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  function update<K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAiFill() {
    if (brief.trim().length < 10) {
      setAiError("Décrivez votre besoin en une phrase avant de laisser l'IA remplir.");
      return;
    }
    setAiError(null);
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/parse-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "L'IA n'a pas pu analyser ce brief.");

      const c = data.campaign;
      setForm({
        title: c.title || "",
        platform: c.platform || "",
        content_type: c.content_type || "",
        niche: c.niche || "",
        country: c.country || "",
        language: c.language || "",
        target_age_min: c.target_age_min != null ? String(c.target_age_min) : "",
        target_age_max: c.target_age_max != null ? String(c.target_age_max) : "",
        creators_needed: c.creators_needed != null ? String(c.creators_needed) : "1",
        budget_per_video: c.budget_per_video_cents != null ? String(c.budget_per_video_cents / 100) : "",
        deliverables: c.deliverables || "",
        deadline: "",
      });
      setAiUsed(true);
      setStep(5); // direct au résumé, pour relecture avant publication
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handlePublish() {
    setPublishError(null);

    if (!form.title.trim()) return setPublishError("Le titre de la campagne est obligatoire.");
    const budgetCents = Math.round(parseFloat(form.budget_per_video || "0") * 100);
    if (!budgetCents || budgetCents <= 0) return setPublishError("Indiquez un budget par vidéo valide.");

    setPublishing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée, reconnectez-vous.");

      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          brand_id: user.id,
          title: form.title.trim(),
          raw_brief: brief.trim() || null,
          ai_generated: aiUsed,
          platform: form.platform || null,
          content_type: form.content_type || null,
          country: form.country.trim() || null,
          language: form.language.trim() || null,
          target_age_min: form.target_age_min ? Number(form.target_age_min) : null,
          target_age_max: form.target_age_max ? Number(form.target_age_max) : null,
          niche: form.niche.trim() || null,
          creators_needed: Number(form.creators_needed) || 1,
          budget_per_video_cents: budgetCents,
          deliverables: form.deliverables.trim() || null,
          deadline: form.deadline || null,
          status: "published",
        })
        .select("id")
        .single();

      if (error) throw error;

      router.push(`/dashboard/brand/campaigns/${data.id}`);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Erreur lors de la publication.");
    } finally {
      setPublishing(false);
    }
  }

  const canGoNext = () => {
    if (step === 0) return form.title.trim().length > 1;
    return true;
  };

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-8">
        <div className="mb-3 flex gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-line"}`} />
          ))}
        </div>
        <p className="text-[13px] font-medium text-ink-soft">
          Étape {step + 1} sur {STEPS.length}
        </p>
        <h1 className="mt-1 font-display text-[24px] font-semibold text-ink">{STEPS[step]}</h1>
      </div>

      <div className="card">
        {step === 0 && (
          <div className="space-y-5">
            <FormField
              id="title"
              label="Titre de la campagne"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Ex : Nouvelle collection automne"
            />

            <div className="rounded-[10px] border border-dashed border-accent/40 bg-accent/5 p-4">
              <p className="mb-2 text-[13.5px] font-semibold text-ink">✨ Laisser l'IA remplir automatiquement</p>
              <p className="mb-3 text-[13px] text-ink-soft">
                Décrivez votre besoin en une phrase, l'IA structure le reste de la campagne.
              </p>
              <textarea
                className="input min-h-[80px] resize-none"
                placeholder="Ex : Je cherche 5 créateurs français entre 18 et 25 ans pour des vidéos TikTok naturelles pour une marque de vêtements. Budget 100€ par vidéo."
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
              />
              {aiError && <p className="error-text mt-2">{aiError}</p>}
              <Button type="button" loading={aiLoading} onClick={handleAiFill} className="mt-3">
                ✨ Générer avec l'IA
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-[14px] font-medium text-ink">Plateforme</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => update("platform", p.value)}
                    className={`rounded-full border px-3.5 py-2 text-[13.5px] font-medium transition ${
                      form.platform === p.value ? "border-accent bg-accent/10 text-accent" : "border-line text-ink-soft hover:bg-bg-soft"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[14px] font-medium text-ink">Type de contenu</label>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => update("content_type", c.value)}
                    className={`rounded-full border px-3.5 py-2 text-[13.5px] font-medium transition ${
                      form.content_type === c.value ? "border-accent bg-accent/10 text-accent" : "border-line text-ink-soft hover:bg-bg-soft"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <FormField id="niche" label="Niche (optionnel)" value={form.niche} onChange={(e) => update("niche", e.target.value)} placeholder="Ex : Mode, Beauté, Tech..." />
            <div>
              <label htmlFor="deliverables" className="mb-2 block text-[14px] font-medium text-ink">Livrable attendu</label>
              <textarea
                id="deliverables"
                className="input min-h-[70px] resize-none"
                value={form.deliverables}
                onChange={(e) => update("deliverables", e.target.value)}
                placeholder="Ex : 1 vidéo verticale 15-30s, ton naturel"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <FormField id="country" label="Pays" value={form.country} onChange={(e) => update("country", e.target.value)} />
              <FormField id="language" label="Langue" value={form.language} onChange={(e) => update("language", e.target.value)} placeholder="fr" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField id="ageMin" type="number" label="Âge minimum" value={form.target_age_min} onChange={(e) => update("target_age_min", e.target.value)} />
              <FormField id="ageMax" type="number" label="Âge maximum" value={form.target_age_max} onChange={(e) => update("target_age_max", e.target.value)} />
            </div>
            <FormField id="creatorsNeeded" type="number" min={1} label="Nombre de créateurs recherchés" value={form.creators_needed} onChange={(e) => update("creators_needed", e.target.value)} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <FormField
              id="budget"
              type="number"
              min={0}
              label="Budget par vidéo (€)"
              value={form.budget_per_video}
              onChange={(e) => update("budget_per_video", e.target.value)}
              placeholder="Ex : 100"
            />
            {form.budget_per_video && form.creators_needed && (
              <p className="text-[13.5px] text-ink-soft">
                Budget total estimé :{" "}
                <strong className="text-ink">
                  {(parseFloat(form.budget_per_video || "0") * Number(form.creators_needed || 1)).toLocaleString("fr-FR")} €
                </strong>{" "}
                pour {form.creators_needed} créateur{Number(form.creators_needed) > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <FormField
              id="deadline"
              type="date"
              label="Date limite de livraison"
              value={form.deadline}
              onChange={(e) => update("deadline", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            {aiUsed && (
              <div className="rounded-[10px] bg-accent/5 px-3 py-2 text-[13px] text-accent">
                ✨ Pré-rempli par l'IA — vérifiez les champs avant de publier.
              </div>
            )}
            <SummaryRow label="Titre" value={form.title} />
            <SummaryRow label="Plateforme" value={PLATFORMS.find((p) => p.value === form.platform)?.label} />
            <SummaryRow label="Type de contenu" value={CONTENT_TYPES.find((c) => c.value === form.content_type)?.label} />
            <SummaryRow label="Niche" value={form.niche} />
            <SummaryRow label="Cible" value={form.country ? `${form.country}${form.target_age_min ? `, ${form.target_age_min}-${form.target_age_max} ans` : ""}` : undefined} />
            <SummaryRow label="Créateurs recherchés" value={form.creators_needed} />
            <SummaryRow label="Budget par vidéo" value={form.budget_per_video ? `${form.budget_per_video} €` : undefined} />
            <SummaryRow label="Livrable" value={form.deliverables} />
            <SummaryRow label="Deadline" value={form.deadline ? new Date(form.deadline).toLocaleDateString("fr-FR") : undefined} />

            {publishError && (
              <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">
                {publishError}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-between border-t border-line pt-6">
          <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            ← Précédent
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canGoNext()}>
              Suivant →
            </Button>
          ) : (
            <Button type="button" onClick={handlePublish} loading={publishing}>
              Publier la campagne
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 text-[14px] last:border-0">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium text-ink">{value || "—"}</span>
    </div>
  );
}
