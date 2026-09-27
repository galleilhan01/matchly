"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
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

        {sent ? (
          <>
            <h1 className="font-display text-[22px] font-semibold text-ink">Vérifiez votre boîte mail</h1>
            <p className="mt-2 text-[14.5px] text-ink-soft">
              Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient d'être envoyé.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-[22px] font-semibold text-ink">Mot de passe oublié</h1>
            <p className="mt-1 mb-6 text-[14.5px] text-ink-soft">
              Indiquez votre e-mail, nous vous enverrons un lien de réinitialisation.
            </p>
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
              {error && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">
                  {error}
                </div>
              )}
              <Button type="submit" loading={loading} className="w-full">
                Envoyer le lien
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-[14px] text-ink-soft">
          <Link href="/login" className="font-medium text-accent">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
