"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface Mission {
  id: string;
  status: string;
  current_video_url: string | null;
  revision_notes: string | null;
  brand_id: string;
  creator_id: string;
}

const MAX_SIZE_MB = 50;

export function MissionActions({ role, mission, hasReview }: { role: "brand" | "creator"; mission: Mission; hasReview: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (mission.current_video_url) {
      supabase.storage
        .from("mission-deliverables")
        .createSignedUrl(mission.current_video_url, 3600)
        .then(({ data }) => {
          if (active) setVideoUrl(data?.signedUrl ?? null);
        });
    }
    return () => {
      active = false;
    };
  }, [supabase, mission.current_video_url]);

  async function updateMission(patch: Record<string, unknown>, label: string) {
    setBusy(label);
    setError(null);
    const { error: err } = await supabase.from("missions").update(patch).eq("id", mission.id);
    setBusy(null);
    if (err) return setError(err.message);
    router.refresh();
  }

  async function submitVideo() {
    if (!file) return setError("Choisissez un fichier vidéo.");
    if (!file.type.startsWith("video/")) return setError("Le fichier doit être une vidéo.");
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return setError(`La vidéo dépasse ${MAX_SIZE_MB} Mo. Compressez-la puis réessayez.`);

    setBusy("upload");
    setError(null);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${mission.id}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from("mission-deliverables").upload(path, file, { contentType: file.type });
    if (upErr) {
      setBusy(null);
      return setError("Échec de l'envoi : " + upErr.message);
    }
    await updateMission({ current_video_url: path, status: "video_submitted" }, "upload");
    setFile(null);
  }

  async function sendReview() {
    setBusy("review");
    setError(null);
    const { error: err } = await supabase.from("reviews").insert({
      mission_id: mission.id,
      brand_id: mission.brand_id,
      creator_id: mission.creator_id,
      rating,
      comment: comment.trim() || null,
    });
    setBusy(null);
    if (err) return setError(err.message);
    router.refresh();
  }

  const s = mission.status;

  return (
    <div className="space-y-4">
      {videoUrl && (
        <div className="card">
          <p className="mb-3 text-[14px] font-semibold text-ink">Dernière vidéo envoyée</p>
          <video src={videoUrl} controls preload="metadata" className="max-h-[480px] w-full rounded-[10px] bg-black" />
          <a href={videoUrl} download className="mt-3 inline-block text-[13px] font-medium text-accent">
            Télécharger
          </a>
        </div>
      )}

      {role === "creator" && s === "accepted" && (
        <div className="card">
          <p className="mb-3 text-[14px] text-ink-soft">Votre candidature a été acceptée. Lancez la production quand vous êtes prêt.</p>
          <Button type="button" loading={busy === "start"} onClick={() => updateMission({ status: "in_production" }, "start")}>
            Démarrer la production
          </Button>
        </div>
      )}

      {role === "creator" && (s === "in_production" || s === "revision_requested") && (
        <div className="card">
          {s === "revision_requested" && mission.revision_notes && (
            <div className="mb-4 rounded-[10px] border border-orange-200 bg-orange-50 p-3 text-[13.5px] text-orange-800">
              <p className="font-semibold">Modification demandée par la marque :</p>
              <p className="mt-1">{mission.revision_notes}</p>
            </div>
          )}
          <p className="mb-3 text-[14px] font-semibold text-ink">{s === "revision_requested" ? "Renvoyer la vidéo modifiée" : "Envoyer votre vidéo"}</p>
          <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-[13.5px] text-ink-soft file:mr-3 file:rounded-[8px] file:border-0 file:bg-bg-soft file:px-3 file:py-2 file:text-[13px] file:font-medium file:text-ink" />
          <p className="mt-2 text-[12px] text-ink-soft">Taille maximale : {MAX_SIZE_MB} Mo.</p>
          <Button type="button" className="mt-4" loading={busy === "upload"} onClick={submitVideo}>
            Envoyer la vidéo
          </Button>
        </div>
      )}

      {role === "creator" && s === "video_submitted" && (
        <div className="card text-[14px] text-ink-soft">Votre vidéo a été envoyée. La marque doit maintenant la valider ou demander une modification.</div>
      )}

      {role === "brand" && s === "video_submitted" && (
        <div className="card">
          <p className="mb-3 text-[14px] font-semibold text-ink">Que pensez-vous de cette vidéo ?</p>
          <Button type="button" loading={busy === "validate"} onClick={() => updateMission({ status: "validated" }, "validate")}>
            ✓ Valider la vidéo
          </Button>
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-[13.5px] font-medium text-ink">Ou demander une modification</p>
            <textarea className="input min-h-[80px] resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Précisez ce qui doit être modifié…" />
            <Button
              type="button"
              variant="ghost"
              className="mt-3"
              loading={busy === "revision"}
              disabled={notes.trim().length < 5}
              onClick={() => updateMission({ status: "revision_requested", revision_notes: notes.trim() }, "revision")}
            >
              Demander une modification
            </Button>
          </div>
        </div>
      )}

      {role === "brand" && (s === "accepted" || s === "in_production") && (
        <div className="card text-[14px] text-ink-soft">Le créateur prépare sa vidéo. Vous serez notifié dès qu'elle sera envoyée.</div>
      )}
      {role === "brand" && s === "revision_requested" && (
        <div className="card text-[14px] text-ink-soft">Modification demandée. En attente de la nouvelle version du créateur.</div>
      )}

      {s === "validated" && (
        <div className="card text-[14px] text-ink-soft">
          ✓ Vidéo validée.{" "}
          {role === "creator"
            ? "Le paiement sera déclenché dès que les paiements Stripe seront activés sur la plateforme."
            : "Le règlement via Stripe sera disponible dès l'activation des paiements."}
        </div>
      )}

      {role === "brand" && (s === "validated" || s === "completed") && !hasReview && (
        <div className="card">
          <p className="mb-3 text-[14px] font-semibold text-ink">Noter ce créateur</p>
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} étoiles`} className={`text-[26px] ${n <= rating ? "text-amber-400" : "text-line"}`}>
                ★
              </button>
            ))}
          </div>
          <textarea className="input min-h-[70px] resize-none" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Un commentaire (optionnel)" />
          <Button type="button" className="mt-3" loading={busy === "review"} onClick={sendReview}>
            Envoyer mon avis
          </Button>
        </div>
      )}

      {error && <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">{error}</div>}
    </div>
  );
}
