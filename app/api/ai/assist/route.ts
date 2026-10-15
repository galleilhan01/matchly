import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AINotConfiguredError, callLLM, checkRateLimit } from "@/lib/ai/provider";

const BASE = "Tu es l'assistant IA de Matchly, une plateforme de mise en relation entre marques et créateurs UGC. Réponds en français, de façon concrète, sans markdown lourd (pas de titres #), sans inventer de chiffres ni de résultats.";

const TASKS: Record<string, string> = {
  improve_application: `${BASE} Réécris la candidature du créateur pour qu'elle soit plus convaincante, personnalisée pour la campagne, authentique et courte (80 à 120 mots). Renvoie uniquement le message final, à la première personne.`,
  contact_message: `${BASE} Rédige un premier message court (60 à 100 mots), chaleureux et professionnel, d'une marque à un créateur pour lui proposer une collaboration. Renvoie uniquement le message.`,
  campaign_brief: `${BASE} Rédige un brief créatif destiné aux créateurs : contexte de la marque, objectif, message clé, format attendu, ton, à faire / à éviter, livrables. Sois structuré avec de courtes sections en texte simple.`,
  video_script: `${BASE} Écris un script vidéo prêt à tourner (durée 20 à 40 s) : hook, scènes avec texte à dire et indications visuelles, call-to-action. Format texte simple avec des étapes numérotées.`,
  hooks: `${BASE} Propose 8 hooks (phrases d'accroche des 3 premières secondes) différents et percutants pour cette vidéo, un par ligne, numérotés.`,
  video_ideas: `${BASE} Propose 6 idées de vidéos différentes (concept en 1 à 2 phrases chacune) adaptées à la plateforme et à la cible, numérotées.`,
  ad_variants: `${BASE} Propose 4 variantes de publicité (angle différent pour chacune : bénéfice, preuve sociale, curiosité, urgence) avec accroche + texte court + call-to-action.`,
  analyze_campaign: `${BASE} Analyse l'état de la campagne à partir des seules données fournies (candidatures, missions, budget). Donne un diagnostic en 3 points et 3 recommandations concrètes. Précise que tu ne disposes pas des performances publicitaires réelles (vues, ventes).`,
};

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
    const { task, context } = await request.json();
    const system = TASKS[task];
    if (!system) return NextResponse.json({ error: "Tâche IA inconnue." }, { status: 400 });

    const text = await callLLM({
      system,
      user: JSON.stringify(context ?? {}).slice(0, 6000),
    });
    return NextResponse.json({ text: text.trim() });
  } catch (err) {
    if (err instanceof AINotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("assist error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur IA." }, { status: 500 });
  }
}
