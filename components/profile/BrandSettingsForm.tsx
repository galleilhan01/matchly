"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { initials } from "@/lib/format";

export function BrandSettingsForm({ userId, email, brand, fullName }: { userId: string; email: string; brand: any; fullName: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(fullName);
  const [company, setCompany] = useState<string>(brand?.company_name ?? "");
  const [industry, setIndustry] = useState<string>(brand?.industry ?? "");
  const [website, setWebsite] = useState<string>(brand?.website ?? "");
  const [description, setDescription] = useState<string>(brand?.description ?? "");
  const [logo, setLogo] = useState<string | null>(brand?.logo_url ?? null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function uploadLogo(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Le logo doit être une image.");
    if (file.size > 5 * 1024 * 1024) return setError("Logo trop lourd (5 Mo maximum).");
    setUploading(true);
    setError(null);
    const path = `${userId}/logo-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
    if (upErr) {
      setUploading(false);
      return setError("Échec de l'envoi : " + upErr.message);
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setLogo(data.publicUrl);
    await supabase.from("brand_profiles").update({ logo_url: data.publicUrl }).eq("profile_id", userId);
    setUploading(false);
  }

  async function save() {
    setError(null);
    setSaved(false);
    if (company.trim().length < 2) return setError("Indiquez le nom de votre marque.");
    setSaving(true);
    const r1 = await supabase.from("profiles").update({ full_name: name.trim() }).eq("id", userId);
    const r2 = await supabase
      .from("brand_profiles")
      .update({ company_name: company.trim(), industry: industry.trim() || null, website: website.trim() || null, description: description.trim() || null })
      .eq("profile_id", userId);
    setSaving(false);
    const err = r1.error || r2.error;
    if (err) return setError(err.message);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <h1 className="font-display text-[26px] font-semibold text-ink">Paramètres</h1>
      <p className="mb-8 mt-1 text-[14.5px] text-ink-soft">Profil de votre marque, visible par les créateurs.</p>

      <div className="card mb-5 flex items-center gap-4">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-16 w-16 rounded-[12px] object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-[12px] bg-bg-soft text-[18px] font-semibold text-ink-soft">{initials(company)}</span>
        )}
        <label className="btn-ghost cursor-pointer">
          {uploading ? "Envoi…" : "Changer le logo"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0] ?? null)} />
        </label>
      </div>

      <div className="card mb-5 space-y-4">
        <FormField id="email" label="E-mail de connexion" value={email} disabled readOnly />
        <FormField id="name" label="Votre nom" value={name} onChange={(e) => setName(e.target.value)} />
        <FormField id="company" label="Nom de la marque" value={company} onChange={(e) => setCompany(e.target.value)} />
        <FormField id="industry" label="Secteur" value={industry} onChange={(e) => setIndustry(e.target.value)} />
        <FormField id="website" label="Site web" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
        <div>
          <label htmlFor="description" className="mb-2 block text-[14px] font-medium text-ink">Description</label>
          <textarea id="description" className="input min-h-[90px] resize-none" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} />
        </div>
      </div>

      {error && <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">{error}</div>}
      {saved && <div className="mb-4 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">Paramètres enregistrés ✓</div>}
      <Button type="button" onClick={save} loading={saving} className="w-full">
        Enregistrer
      </Button>
    </div>
  );
}
