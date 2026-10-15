/**
 * Couche d'abstraction du fournisseur IA : pour changer de fournisseur, il suffit
 * de modifier les variables d'environnement, jamais le reste du code.
 *
 *   AI_PROVIDER = google (gratuit via Google AI Studio) | anthropic | openai
 *   AI_API_KEY  = clé du fournisseur choisi
 *   AI_MODEL    = (optionnel) surcharge du modèle par défaut
 */

interface LLMRequest {
  system: string;
  user: string;
  json?: boolean;
}

const DEFAULT_MODELS: Record<string, string> = {
  google: "gemini-2.5-flash-lite",
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4o-mini",
};

export class AINotConfiguredError extends Error {
  constructor() {
    super("L'IA n'est pas configurée sur ce déploiement (variable AI_API_KEY manquante).");
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, ms = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function callLLM({ system, user, json = false }: LLMRequest): Promise<string> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new AINotConfiguredError();

  const provider = process.env.AI_PROVIDER || "google";
  const model = process.env.AI_MODEL || DEFAULT_MODELS[provider] || DEFAULT_MODELS.google;

  if (provider === "anthropic") {
    const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 1500, system, messages: [{ role: "user", content: user }] }),
    });
    if (!res.ok) throw new Error(`Erreur du fournisseur IA (${res.status})`);
    const data = await res.json();
    const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    if (!text) throw new Error("Réponse IA vide.");
    return text;
  }

  if (provider === "openai") {
    const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        ...(json ? { response_format: { type: "json_object" } } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Erreur du fournisseur IA (${res.status})`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("Réponse IA vide.");
    return text;
  }

  // Google Gemini (par défaut, offre gratuite)
  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        ...(json ? { generationConfig: { responseMimeType: "application/json" } } : {}),
      }),
    }
  );
  if (!res.ok) throw new Error(`Erreur du fournisseur IA (${res.status})`);
  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("");
  if (!text) throw new Error("Réponse IA vide.");
  return text;
}

/** Limite simple par utilisateur (mémoire du serveur) pour éviter qu'un compte ne vide le quota gratuit. */
const buckets = new Map<string, number[]>();
export function checkRateLimit(userId: string, max = 30, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const recent = (buckets.get(userId) || []).filter((t) => now - t < windowMs);
  if (recent.length >= max) return false;
  recent.push(now);
  buckets.set(userId, recent);
  return true;
}
