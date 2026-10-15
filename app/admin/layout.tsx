import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar, type SidebarItem } from "@/components/dashboard/Sidebar";

const NAV_ITEMS: SidebarItem[] = [
  { label: "Statistiques", href: "/admin", icon: "📊" },
  { label: "Utilisateurs", href: "/admin/users", icon: "👥" },
  { label: "Campagnes", href: "/admin/campaigns", icon: "📣" },
  { label: "Paiements", href: "/admin/payments", icon: "💳" },
  { label: "Commissions", href: "/admin/commissions", icon: "％" },
  { label: "Signalements", href: "/admin/reports", icon: "⚑" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("account_type, full_name").eq("id", user.id).single();
  if (profile?.account_type !== "admin") redirect("/login");

  return (
    <div className="min-h-screen md:flex">
      <DashboardSidebar items={NAV_ITEMS} accountLabel={profile.full_name || "Administrateur"} accountSubtitle="Administration" userId={user.id} />
      <main className="min-w-0 flex-1 bg-bg px-4 py-6 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
