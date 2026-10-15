import { createClient } from "@/lib/supabase/server";
import { BrandSettingsForm } from "@/components/profile/BrandSettingsForm";

export default async function BrandSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: brand }, { data: profile }] = await Promise.all([
    supabase.from("brand_profiles").select("*").eq("profile_id", user!.id).single(),
    supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
  ]);
  return <BrandSettingsForm userId={user!.id} email={user!.email ?? ""} brand={brand} fullName={profile?.full_name ?? ""} />;
}
