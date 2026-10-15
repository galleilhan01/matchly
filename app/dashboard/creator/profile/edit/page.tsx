import { createClient } from "@/lib/supabase/server";
import { CreatorProfileForm } from "@/components/profile/CreatorProfileForm";

export default async function EditCreatorProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: creator }, { data: socials }, { data: portfolio }] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url").eq("id", user!.id).single(),
    supabase.from("creator_profiles").select("*").eq("profile_id", user!.id).single(),
    supabase.from("creator_socials").select("*").eq("creator_id", user!.id),
    supabase.from("portfolio_items").select("*").eq("creator_id", user!.id).order("created_at", { ascending: false }),
  ]);

  return <CreatorProfileForm userId={user!.id} profile={profile} creator={creator} socials={socials ?? []} portfolio={portfolio ?? []} />;
}
