"use client";

import { useState } from "react";
import { AiButton } from "@/components/ai/AiButton";

const TOOLS = [
  { task: "campaign_brief", label: "✨ Générer le brief" },
  { task: "video_script", label: "🎬 Script vidéo" },
  { task: "hooks", label: "🪝 Hooks" },
  { task: "video_ideas", label: "💡 Idées de vidéos" },
  { task: "ad_variants", label: "📣 Variantes de pub" },
  { task: "analyze_campaign", label: "📊 Analyser la campagne" },
];

export function AiToolsPanel({ context }: { context: unknown }) {
  const [result, setResult] = useState<{ task: string; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="card mb-8">
      <p className="mb-1 text-[14.5px] font-semibold text-ink">Assistant IA</p>
      <p className="mb-4 text-[13px] text-ink-soft">
        Génère du contenu à partir des informations de cette campagne. À relire avant utilisation.
      </p>
      <div className="flex flex-wrap gap-2">
        {TOOLS.map((t) => (
          <AiButton key={t.task} task={t.task} context={context} label={t.label} onResult={(text, task) => setResult({ task, text })} />
        ))}
      </div>
      {result && (
        <div className="mt-4 rounded-[10px] border border-line bg-bg-soft p-4">
          <pre className="whitespace-pre-wrap font-body text-[13.5px] leading-relaxed text-ink">{result.text}</pre>
          <button type="button" onClick={copy} className="mt-3 text-[13px] font-medium text-accent">
            {copied ? "Copié ✓" : "Copier"}
          </button>
        </div>
      )}
    </div>
  );
}
