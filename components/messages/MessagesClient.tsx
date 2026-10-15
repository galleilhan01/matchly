"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, initials } from "@/lib/format";

interface Conversation {
  id: string;
  brand_id: string;
  creator_id: string;
  campaign_id: string | null;
  created_at: string;
  otherName: string;
  campaignTitle: string | null;
  unread: number;
  lastAt: string;
}

export function MessagesClient({ role, userId, initialConversationId }: { role: "brand" | "creator"; userId: string; initialConversationId?: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId ?? null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<string | null>(selectedId);
  selectedRef.current = selectedId;

  const loadConversations = useCallback(async () => {
    const { data: convs } = await supabase.from("conversations").select("*").order("created_at", { ascending: false });
    const list = convs ?? [];
    const otherIds = Array.from(new Set(list.map((c: any) => (role === "brand" ? c.creator_id : c.brand_id))));
    const campaignIds = Array.from(new Set(list.map((c: any) => c.campaign_id).filter(Boolean)));

    const [{ data: names }, { data: brandNames }, { data: campaigns }, { data: unreadRows }, { data: lastRows }] = await Promise.all([
      otherIds.length ? supabase.from("profiles").select("id, full_name").in("id", otherIds) : Promise.resolve({ data: [] as any[] }),
      otherIds.length && role === "creator" ? supabase.from("brand_profiles").select("profile_id, company_name").in("profile_id", otherIds) : Promise.resolve({ data: [] as any[] }),
      campaignIds.length ? supabase.from("campaigns").select("id, title").in("id", campaignIds as string[]) : Promise.resolve({ data: [] as any[] }),
      supabase.from("messages").select("conversation_id").eq("is_read", false).neq("sender_id", userId),
      supabase.from("messages").select("conversation_id, created_at").order("created_at", { ascending: false }).limit(500),
    ]);

    const nameById = new Map<string, string>();
    (names ?? []).forEach((n: any) => nameById.set(n.id, n.full_name));
    (brandNames ?? []).forEach((b: any) => b.company_name && nameById.set(b.profile_id, b.company_name));
    const campaignById = new Map<string, any>((campaigns ?? []).map((c: any) => [c.id, c.title] as [string, any]));
    const unreadBy = new Map<string, number>();
    (unreadRows ?? []).forEach((r: any) => unreadBy.set(r.conversation_id, (unreadBy.get(r.conversation_id) ?? 0) + 1));
    const lastBy = new Map<string, string>();
    (lastRows ?? []).forEach((r: any) => {
      if (!lastBy.has(r.conversation_id)) lastBy.set(r.conversation_id, r.created_at);
    });

    const enriched: Conversation[] = list.map((c: any) => ({
      ...c,
      otherName: nameById.get(role === "brand" ? c.creator_id : c.brand_id) || "Utilisateur",
      campaignTitle: c.campaign_id ? (campaignById.get(c.campaign_id) as string) ?? null : null,
      unread: unreadBy.get(c.id) ?? 0,
      lastAt: lastBy.get(c.id) ?? c.created_at,
    }));
    enriched.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
    setConversations(enriched);
    setLoading(false);
  }, [supabase, role, userId]);

  const loadMessages = useCallback(
    async (id: string) => {
      const { data } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true });
      setMessages(data ?? []);
      await supabase.rpc("mark_messages_read", { p_conversation_id: id });
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    },
    [supabase]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
    else setMessages([]);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    const channel = supabase
      .channel("messages-" + userId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m: any = payload.new;
        if (m.conversation_id === selectedRef.current) {
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.sender_id !== userId) supabase.rpc("mark_messages_read", { p_conversation_id: m.conversation_id });
        } else {
          loadConversations();
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(content: string | null, filePath: string | null) {
    if (!selectedId) return;
    setError(null);
    const { data, error: err } = await supabase
      .from("messages")
      .insert({ conversation_id: selectedId, sender_id: userId, content, file_url: filePath })
      .select("*")
      .single();
    if (err) return setError(err.message);
    setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
    loadConversations();
  }

  async function handleSend() {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    setText("");
    await send(content, null);
    setSending(false);
  }

  async function handleFile(file: File | null) {
    if (!file || !selectedId) return;
    if (file.size > 50 * 1024 * 1024) return setError("Fichier trop volumineux (50 Mo maximum).");
    setSending(true);
    setError(null);
    const path = `${selectedId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("message-attachments").upload(path, file, { contentType: file.type });
    if (upErr) {
      setSending(false);
      return setError("Échec de l'envoi du fichier : " + upErr.message);
    }
    await send(null, path);
    setSending(false);
  }

  async function openFile(path: string) {
    const { data } = await supabase.storage.from("message-attachments").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[480px] overflow-hidden rounded-card border border-line md:h-[calc(100vh-5rem)]">
      <div className={`w-full flex-shrink-0 overflow-y-auto border-r border-line md:block md:w-80 ${selectedId ? "hidden" : "block"}`}>
        <div className="border-b border-line px-4 py-4">
          <h1 className="font-display text-[18px] font-semibold text-ink">Messages</h1>
        </div>
        {loading ? (
          <p className="p-4 text-[13.5px] text-ink-soft">Chargement…</p>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-[13.5px] text-ink-soft">
            <p className="mb-1 text-[28px]">💬</p>
            Aucune conversation pour l'instant.
            {role === "brand" ? " Contactez un créateur depuis son profil." : " Les marques peuvent vous contacter ici."}
          </div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left hover:bg-bg-soft ${selectedId === c.id ? "bg-accent/5" : ""}`}
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-bg-soft text-[13px] font-semibold text-ink-soft">{initials(c.otherName)}</span>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[14px] ${c.unread ? "font-semibold text-ink" : "font-medium text-ink"}`}>{c.otherName}</p>
                <p className="truncate text-[12.5px] text-ink-soft">{c.campaignTitle || "Conversation directe"}</p>
              </div>
              {c.unread > 0 && <span className="rounded-full bg-accent px-1.5 text-[11px] font-semibold leading-[18px] text-white">{c.unread}</span>}
            </button>
          ))
        )}
      </div>

      <div className={`min-w-0 flex-1 flex-col ${selectedId ? "flex" : "hidden md:flex"}`}>
        {!selected ? (
          <div className="flex flex-1 items-center justify-center text-[14px] text-ink-soft">Sélectionnez une conversation</div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <button onClick={() => setSelectedId(null)} className="text-[18px] md:hidden" aria-label="Retour">
                ←
              </button>
              <div className="min-w-0">
                <p className="truncate text-[14.5px] font-semibold text-ink">{selected.otherName}</p>
                <p className="truncate text-[12.5px] text-ink-soft">{selected.campaignTitle || "Conversation directe"}</p>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto bg-bg-soft px-4 py-4">
              {messages.length === 0 && <p className="text-center text-[13px] text-ink-soft">Aucun message. Écrivez le premier !</p>}
              {messages.map((m) => {
                const mine = m.sender_id === userId;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-[14px] px-3.5 py-2 text-[14px] ${mine ? "bg-accent text-white" : "bg-bg text-ink border border-line"}`}>
                      {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                      {m.file_url && (
                        <button onClick={() => openFile(m.file_url)} className={`underline ${mine ? "text-white" : "text-accent"}`}>
                          📎 {m.file_url.split("/").pop()?.replace(/^\d+-/, "")}
                        </button>
                      )}
                      <p className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${mine ? "text-white/70" : "text-ink-soft"}`}>
                        {formatDateTime(m.created_at)}
                        {mine && <span title={m.is_read ? "Lu" : "Envoyé"}>{m.is_read ? "✓✓" : "✓"}</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {error && <p className="error-text border-t border-line px-4 py-2">{error}</p>}
            <div className="flex items-end gap-2 border-t border-line p-3">
              <label className="cursor-pointer rounded-[10px] px-2.5 py-2.5 text-[18px] hover:bg-bg-soft" title="Joindre un fichier ou une vidéo">
                📎
                <input type="file" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Écrire un message…"
                className="input max-h-32 min-h-[44px] flex-1 resize-none"
              />
              <button onClick={handleSend} disabled={sending || !text.trim()} className="btn-primary !px-4">
                Envoyer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
