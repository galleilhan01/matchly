export function formatEuros(cents: number | null | undefined) {
  return ((cents ?? 0) / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export function formatDate(d?: string | null) {
  return d ? new Date(d).toLocaleDateString("fr-FR") : "—";
}

export function formatDateTime(d: string) {
  return new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export function formatCount(n: number | null | undefined) {
  const v = n ?? 0;
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace(".0", "") + " M";
  if (v >= 1000) return (v / 1000).toFixed(1).replace(".0", "") + " k";
  return String(v);
}

export const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  ugc: "UGC",
  face_camera: "Face caméra",
  voice_over: "Voice-over",
  unboxing: "Unboxing",
  product_test: "Test produit",
  lifestyle: "Lifestyle",
  other: "Autre",
};

export const MISSION_STATUS: Record<string, { label: string; className: string }> = {
  accepted: { label: "Accepté", className: "bg-accent/10 text-accent" },
  in_production: { label: "En production", className: "bg-amber-100 text-amber-700" },
  video_submitted: { label: "Vidéo envoyée", className: "bg-sky-100 text-sky-700" },
  revision_requested: { label: "Révision demandée", className: "bg-orange-100 text-orange-700" },
  validated: { label: "Validée", className: "bg-emerald-100 text-emerald-700" },
  completed: { label: "Terminée", className: "bg-emerald-100 text-emerald-700" },
};

export const APPLICATION_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-line text-ink-soft" },
  accepted: { label: "Acceptée", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Refusée", className: "bg-red-100 text-red-700" },
  withdrawn: { label: "Retirée", className: "bg-line text-ink-soft" },
};

export function initials(name?: string | null) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
