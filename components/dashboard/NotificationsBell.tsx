"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/format";

export function NotificationsBell({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from("notifications")
      .select("*")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false })
      .limit(15)
      .then(({ data }) => {
        if (active) setItems(data ?? []);
      });

    const channel = supabase
      .channel("notifications-" + userId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `profile_id=eq.${userId}` },
        (payload) => setItems((prev) => [payload.new, ...prev].slice(0, 15))
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const unread = items.filter((n) => !n.is_read).length;

  async function openItem(n: any) {
    setOpen(false);
    if (!n.is_read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
    }
    if (n.link) router.push(n.link);
  }

  async function markAllRead() {
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    await supabase.from("notifications").update({ is_read: true }).eq("profile_id", userId).eq("is_read", false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative rounded-[10px] px-2.5 py-2 text-[17px] hover:bg-bg"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-accent px-1 text-center text-[11px] font-semibold leading-[18px] text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 max-h-[420px] w-[min(320px,calc(100vw-2rem))] overflow-y-auto rounded-card border border-line bg-bg shadow-lg">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-[14px] font-semibold text-ink">Notifications</p>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[12.5px] font-medium text-accent">
                  Tout marquer comme lu
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13.5px] text-ink-soft">Aucune notification pour l'instant.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`block w-full border-b border-line px-4 py-3 text-left last:border-0 hover:bg-bg-soft ${n.is_read ? "" : "bg-accent/5"}`}
                >
                  <p className="text-[13.5px] font-semibold text-ink">{n.title}</p>
                  {n.body && <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-soft">{n.body}</p>}
                  <p className="mt-1 text-[11.5px] text-ink-soft">{formatDateTime(n.created_at)}</p>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
