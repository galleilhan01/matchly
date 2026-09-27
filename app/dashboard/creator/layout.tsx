import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar, type SidebarItem } from "@/components/dashboard/Sidebar";

const NAV_ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard/creator", icon: "🏠" },
  { label: "Campagnes", href: "/dashboard/creator/campaigns", icon: "📣" },
  { label: "Mes candidatures", href: "/dashboard/creator/applications", icon: "📝" },
  { label: "Missions", href: "/dashboard/creator/missions", icon: "🎬" },
  { label: "Messages", href: "/dashboard/creator/messages", icon: "💬" },
  { label: "Revenus", href: "/dashboard/creator/earnings", icon: "💰" },
  { label: "Profil", href: "/dashboard/creator/profile", icon: "👤" },
];

export default async function CreatorDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("account_type, full_name").eq("id", user.id).single();

  if (profile?.account_type === "brand") redirect("/dashboard/brand");

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        items={NAV_ITEMS}
        accountLabel={profile?.full_name?.trim() || "Votre profil"}
        accountSubtitle="Compte créateur"
      />
      <main className="flex-1 overflow-y-auto bg-bg px-10 py-10">{children}</main>
    </div>
  );
}
