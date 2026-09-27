"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface SidebarItem {
  label: string;
  href: string;
  icon: string;
}

export function DashboardSidebar({
  items,
  accountLabel,
  accountSubtitle,
}: {
  items: SidebarItem[];
  accountLabel: string;
  accountSubtitle: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-line bg-bg-soft px-4 py-6">
      <Link href="/" className="mb-8 flex items-center gap-2 px-2 font-display text-lg font-bold text-ink">
        <span className="h-6 w-6 rounded-[7px] bg-accent" /> Matchly
      </Link>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14.5px] font-medium transition ${
                active ? "bg-accent/10 text-accent" : "text-ink-soft hover:bg-bg hover:text-ink"
              }`}
            >
              <span className="text-[16px]">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line pt-4">
        <div className="mb-2 px-2">
          <p className="truncate text-[13.5px] font-semibold text-ink">{accountLabel}</p>
          <p className="truncate text-[12.5px] text-ink-soft">{accountSubtitle}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-ink-soft transition hover:bg-bg hover:text-ink"
        >
          <span>↪</span> Déconnexion
        </button>
      </div>
    </aside>
  );
}
