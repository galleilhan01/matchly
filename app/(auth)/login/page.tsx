"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        throw new Error(
          signInError.message === "Invalid login credentials"
            ? "E-mail ou mot de passe incorrect."
            : signInError.message
        );
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type, is_suspended")
        .eq("id", data.user.id)
        .returns<{ account_type: "brand" | "creator" | "admin"; is_suspended: boolean }[]>()
        .single();

      if (profile?.is_suspended) {
        await supabase.auth.signOut();
        throw new Error("Ce compte a été suspendu. Contactez le support.");
      }

      const redirectedFrom = searchParams.get("redirectedFrom");
      router.push(redirectedFrom || (profile?.account_type === "brand" ? "/dashboard/brand" : "/dashboard/creator"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
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
        <h1 className="font-display text-[24px] font-semibold text-ink">Connexion</h1>
        <p className="mt-1 mb-6 text-[14.5px] text-ink-soft">Contenu à retrouver, campagnes à suivre.</p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            id="email"
            type="email"
            label="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="text-[14px] font-medium text-ink">Mot de passe</label>
              <Link href="/forgot-password" className="text-[13px] font-medium text-accent">
                Mot de passe oublié ?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Se connecter
          </Button>
        </form>

        <p className="mt-6 text-center text-[14px] text-ink-soft">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium text-accent">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
