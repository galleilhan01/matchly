import { formatDateTime } from "@/lib/format";

const STEPS = [
  { key: "accepted", label: "Accepté" },
  { key: "in_production", label: "En production" },
  { key: "video_submitted", label: "Vidéo envoyée" },
  { key: "revision_requested", label: "Révision" },
  { key: "validated", label: "Validée" },
  { key: "completed", label: "Terminée" },
];

export function MissionTimeline({ status, events }: { status: string; events: any[] }) {
  const lastByStatus = new Map<string, any>();
  events.forEach((e: any) => lastByStatus.set(e.status, e));
  const order = STEPS.map((s) => s.key);
  const currentIndex = order.indexOf(status);

  const steps = STEPS.filter((s) => s.key !== "revision_requested" || lastByStatus.has("revision_requested") || status === "revision_requested");

  return (
    <ol className="space-y-0">
      <li className="flex gap-3">
        <div className="flex flex-col items-center">
          <span className="h-3 w-3 rounded-full bg-accent" />
          <span className="w-px flex-1 bg-accent/40" />
        </div>
        <p className="pb-5 text-[14px] font-medium text-ink">Candidature envoyée</p>
      </li>
      {steps.map((s, i) => {
        const reached = lastByStatus.has(s.key) || order.indexOf(s.key) <= currentIndex;
        const current = s.key === status;
        const event = lastByStatus.get(s.key);
        const isLast = i === steps.length - 1;
        return (
          <li key={s.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`h-3 w-3 rounded-full ${current ? "bg-accent ring-4 ring-accent/20" : reached ? "bg-accent" : "bg-line"}`} />
              {!isLast && <span className={`w-px flex-1 ${reached && !current ? "bg-accent/40" : "bg-line"}`} />}
            </div>
            <div className="pb-5">
              <p className={`text-[14px] font-medium ${reached ? "text-ink" : "text-ink-soft"}`}>{s.label}</p>
              {event && <p className="text-[12px] text-ink-soft">{formatDateTime(event.created_at)}</p>}
              {event?.note && s.key === "revision_requested" && (
                <p className="mt-1 rounded-[8px] bg-bg-soft px-3 py-2 text-[13px] text-ink">{event.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
