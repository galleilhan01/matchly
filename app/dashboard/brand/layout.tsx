import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar, type SidebarItem } from "@/components/dashboard/Sidebar";

const NAV_ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard/brand", icon: "🏠" },
  { label: "Campagnes", href: "/dashboard/brand/campaigns", icon: "📣" },
  { label: "Créateurs", href: "/dashboard/brand/creators", icon: "🎬" },
  { label: "Messages", href: "/dashboard/brand/messages", icon: "💬" },
  { label: "Livrables", href: "/dashboard/brand/deliverables", icon: "📦" },
  { label: "Paiements", href: "/dashboard/brand/payments", icon: "💳" },
  { label: "Paramètres", href: "/dashboard/brand/settings", icon: "⚙️" },
];

export default async function BrandDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("account_type").eq("id", user.id).single();

  // Un créateur qui atterrit ici est redirigé vers son propre dashboard,
  // plutôt que de voir une erreur ou des données qui ne le concernent pas.
  if (profile?.account_type === "creator") redirect("/dashboard/creator");

  const { data: brand } = await supabase
    .from("brand_profiles")
    .select("company_name")
    .eq("profile_id", user.id)
    .single();

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        items={NAV_ITEMS}
        accountLabel={brand?.company_name?.trim() || "Votre marque"}
        accountSubtitle="Compte marque"
      />
      <main className="flex-1 overflow-y-auto bg-bg px-10 py-10">{children}</main>
    </div>
  );
}
