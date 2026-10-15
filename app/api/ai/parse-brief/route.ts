import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AINotConfiguredError, callLLM, checkRateLimit } from "@/lib/ai/provider";

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
  "creators_needed": number (1 si non précisé),
  "budget_per_video_cents": number (en centimes, ex: 100 € => 10000),
  "deliverables": string | null
}
Déduis les champs manquants du contexte du mieux possible, sinon null (sauf creators_needed).`;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "Trop de demandes IA, réessayez dans un moment." }, { status: 429 });
  }

  try {
    const { brief } = await request.json();
    if (!brief || typeof brief !== "string" || brief.trim().length < 10) {
      return NextResponse.json({ error: "Le brief doit contenir au moins une phrase complète." }, { status: 400 });
    }

    const raw = await callLLM({ system: SYSTEM_PROMPT, user: brief.slice(0, 2000), json: true });
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Réponse IA non structurée, réessayez.");

    return NextResponse.json({ campaign: JSON.parse(match[0]) });
  } catch (err) {
    if (err instanceof AINotConfiguredError) {
      return NextResponse.json(
        { error: err.message + " Vous pouvez remplir le formulaire manuellement." },
        { status: 503 }
      );
    }
    console.error("parse-brief error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inattendue lors de l'analyse du brief." },
      { status: 500 }
    );
  }
}
