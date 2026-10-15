"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";

export interface SidebarItem {
  label: string;
  href: string;
  icon: string;
}

export function DashboardSidebar({
  items,
  accountLabel,
  accountSubtitle,
  userId,
}: {
  items: SidebarItem[];
  accountLabel: string;
  accountSubtitle: string;
  userId: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Le premier item est la racine du dashboard : actif uniquement sur cette page exacte.
  const rootHref = items[0]?.href;

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg px-4 py-3 md:hidden">
        <button onClick={() => setOpen(true)} aria-label="Ouvrir le menu" className="rounded-[10px] px-2.5 py-1.5 text-[20px] hover:bg-bg-soft">
          ☰
        </button>
        <span className="flex items-center gap-2 font-display text-[17px] font-bold text-ink">
          <span className="h-5 w-5 rounded-[6px] bg-accent" /> Matchly
        </span>
        <NotificationsBell userId={userId} />
      </header>

      {open && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-shrink-0 flex-col border-r border-line bg-bg-soft px-4 py-6 transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <span className="h-6 w-6 rounded-[7px] bg-accent" /> Matchly
          </Link>
          <div className="hidden md:block">
            <NotificationsBell userId={userId} />
          </div>
          <button onClick={() => setOpen(false)} aria-label="Fermer le menu" className="px-2 text-[18px] text-ink-soft md:hidden">
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active = item.href === rootHref ? pathname === item.href : pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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
    </>
  );
}
