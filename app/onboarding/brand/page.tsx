"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

const INDUSTRIES = ["Mode", "Beauté", "Tech", "Alimentation", "Sport", "Lifestyle", "Autre"];

export default function BrandOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (companyName.trim().length < 2) return setError("Indiquez le nom de votre marque.");

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée, reconnectez-vous.");

      const { error: updateError } = await supabase
        .from("brand_profiles")
        .update({
          company_name: companyName.trim(),
          industry,
          website: website.trim() || null,
          description: description.trim() || null,
        })
        .eq("profile_id", user.id);

      if (updateError) throw updateError;

      router.push("/dashboard/brand");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-soft px-6 py-12">
      <div className="w-full max-w-[520px] card">
        <div className="mb-6 flex items-center gap-2 text-[13px] font-medium text-ink-soft">
          <span className="h-1.5 w-8 rounded-full bg-accent" />
          <span className="h-1.5 w-8 rounded-full bg-line" />
          Étape 1 sur 2
        </div>
        <h1 className="font-display text-[24px] font-semibold text-ink">Parlez-nous de votre marque</h1>
        <p className="mt-1 mb-6 text-[14.5px] text-ink-soft">
          Ces informations seront visibles par les créateurs que vous contactez.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            id="companyName"
            label="Nom de la marque"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Ex : Nordik Apparel"
          />

          <div>
            <label className="mb-2 block text-[14px] font-medium text-ink">Secteur d'activité</label>
            <select
              className="input"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          <FormField
            id="website"
            label="Site web (optionnel)"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
          />

          <div>
            <label htmlFor="description" className="mb-2 block text-[14px] font-medium text-ink">
              Description courte (optionnel)
            </label>
            <textarea
              id="description"
              className="input min-h-[90px] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="En quelques mots, ce que fait votre marque."
              maxLength={280}
            />
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
