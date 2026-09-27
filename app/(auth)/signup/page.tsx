"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import type { AccountType } from "@/types/database";

type FormErrors = Partial<Record<"fullName" | "email" | "password" | "accountType", string>>;

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!accountType) next.accountType = "Choisissez un type de compte.";
    if (fullName.trim().length < 2) next.fullName = "Indiquez votre nom complet.";
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Adresse e-mail invalide.";
    if (password.length < 8) next.password = "8 caractères minimum.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, account_type: accountType } },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Compte non créé, réessayez.");

      // Le profil de base (table `profiles`) est créé automatiquement
      // par un trigger Postgres `on_auth_user_created` côté Supabase
      // (voir schema.sql) qui lit `raw_user_meta_data`.

      router.push(accountType === "brand" ? "/onboarding/brand" : "/onboarding/creator");
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message === "User already registered"
            ? "Un compte existe déjà avec cet e-mail."
            : err.message
          : "Une erreur est survenue, réessayez."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-soft px-6 py-12">
      <div className="w-full max-w-[420px] card">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 font-display text-lg font-bold text-ink">
          <span className="h-6 w-6 rounded-[7px] bg-accent" /> Matchly
        </Link>
        <h1 className="font-display text-[24px] font-semibold text-ink">Créer un compte</h1>
        <p className="mt-1 mb-6 text-[14.5px] text-ink-soft">Rejoignez Matchly en tant que marque ou créateur.</p>

        <div className="mb-5 grid grid-cols-2 gap-3">
          {(["brand", "creator"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAccountType(type)}
              className={`rounded-[10px] border px-4 py-4 text-left text-[14px] font-semibold transition ${
                accountType === type ? "border-accent bg-accent/5 text-accent" : "border-line text-ink hover:bg-bg-soft"
              }`}
            >
              {type === "brand" ? "🏢 Je suis une marque" : "🎬 Je suis créateur"}
            </button>
          ))}
        </div>
        {errors.accountType && <p className="error-text -mt-3 mb-4">{errors.accountType}</p>}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            id="fullName"
            label="Nom complet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
            autoComplete="name"
          />
          <FormField
            id="email"
            type="email"
            label="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <FormField
            id="password"
            type="password"
            label="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />

          {serverError && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">
              {serverError}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Créer mon compte
          </Button>
        </form>

        <p className="mt-6 text-center text-[14px] text-ink-soft">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-accent">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
