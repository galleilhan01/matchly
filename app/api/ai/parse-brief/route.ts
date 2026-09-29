import { NextResponse } from "next/server";

/**
 * Transforme une phrase libre de marque en campagne structurée, via un vrai
 * appel LLM (pas de simulation). Le fournisseur est abstrait derrière
 * AI_PROVIDER pour pouvoir en changer sans toucher au reste du code.
 *
 * Variables d'environnement requises (à ajouter sur Railway) :
 *   AI_PROVIDER=anthropic   (ou "openai")
 *   AI_API_KEY=sk-...
 */

const SYSTEM_PROMPT = `Tu es un assistant qui structure des briefs de campagnes publicitaires UGC.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, avec exactement ces champs :
{
  "title": string (titre court de la campagne),
  "platform": "tiktok" | "instagram" | "youtube" | null,
  "content_type": "ugc" | "face_camera" | "voice_over" | "unboxing" | "product_test" | "lifestyle" | "other" | null,
  "country": string | null,
  "language": string | null (code langue, ex: "fr"),
  "target_age_min": number | null,
  "target_age_max": number | null,
  "niche": string | null,
  "creators_needed": number (défaut 1 si non précisé),
  "budget_per_video_cents": number (en centimes, ex: 100€ => 10000),
  "deliverables": string | null (description courte du livrable attendu)
}
Déduis les champs manquants du contexte du mieux possible. Si une info est absente, mets null (sauf creators_needed qui doit toujours être un nombre).`;

async function callAnthropic(brief: string, apiKey: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: brief }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((block: any) => block.type === "text");
  if (!textBlock) throw new Error("Réponse IA vide.");
  return textBlock.text;
}

async function callOpenAI(brief: string, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: brief },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Réponse IA vide.");
  return content;
}

export async function POST(request: Request) {
  try {
    const { brief } = await request.json();

    if (!brief || typeof brief !== "string" || brief.trim().length < 10) {
      return NextResponse.json({ error: "Le brief doit contenir au moins une phrase complète." }, { status: 400 });
    }

    const provider = process.env.AI_PROVIDER || "anthropic";
    const apiKey = process.env.AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "L'IA n'est pas configurée sur ce déploiement : il manque la variable AI_API_KEY. Vous pouvez toujours remplir le formulaire manuellement.",
        },
        { status: 503 }
      );
    }

    const rawText = provider === "openai" ? await callOpenAI(brief, apiKey) : await callAnthropic(brief, apiKey);

    // Le modèle peut parfois entourer le JSON de texte malgré la consigne : on extrait le premier objet JSON valide.
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Réponse IA non structurée, réessayez.");

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ campaign: parsed });
  } catch (err) {
    console.error("parse-brief error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inattendue lors de l'analyse du brief." },
      { status: 500 }
    );
  }
}
