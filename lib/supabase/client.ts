import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase utilisable uniquement côté navigateur (Client Components).
 * N'utilise que la clé anonyme, protégée par les policies RLS.
 *
 * NOTE : non typé génériquement pour l'instant (le fichier types/database.ts
 * ne couvre que quelques tables). Une fois en prod, générer les types complets
 * avec `npx supabase gen types typescript --project-id <id> > types/database.ts`
 * puis réactiver `createBrowserClient<Database>(...)`.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
