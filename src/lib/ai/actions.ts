import { chat, ChatMessage } from "./providers";
import {
  AIAction,
  AIResponse,
  BookProject,
  Chapter,
  CoherenceIssue,
} from "../types";

const SYSTEM_PROMPT = `Tu es un assistant littéraire expert en rédaction de romans et ouvrages longs.
Tu travailles en français sauf demande contraire.
Tu connais les règles narratives, la structure en actes, le développement des personnages et la cohérence interne d'un récit.
Réponds de manière précise et utile, sans commentaires meta inutiles.`;

function projectContext(project: BookProject): string {
  const chapterSummaries = project.chapters
    .map(
      (c) =>
        `Chapitre ${c.number} — « ${c.title} » [${c.status}]\nPlan: ${c.outline || "(vide)"}\nContenu: ${truncate(c.content, 800)}`
    )
    .join("\n\n");

  return `# Projet : ${project.title}

## Pitch
${project.pitch}

## Synopsis
${project.synopsis || "(non renseigné)"}

## Genre
${project.genre || "(non renseigné)"}

## Public cible
${project.targetAudience || "(non renseigné)"}

## Chapitres existants
${chapterSummaries || "(aucun chapitre)"}`;
}

function chapterContext(chapter: Chapter): string {
  return `# Chapitre ${chapter.number} — « ${chapter.title} »

## Plan
${chapter.outline || "(vide)"}

## Contenu actuel
${chapter.content || "(vide)"}

## Notes de l'auteur
${chapter.notes || "(aucune)"}`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text || "(vide)";
  return text.slice(0, max) + "…";
}

function buildMessages(
  project: BookProject,
  action: AIAction,
  chapter?: Chapter,
  userPrompt?: string
): ChatMessage[] {
  const ctx = projectContext(project);
  const chCtx = chapter ? chapterContext(chapter) : "";

  const prompts: Record<AIAction, string> = {
    "generate-outline": `${ctx}

${chCtx}

Génère un plan détaillé pour ce chapitre (structure en scènes, objectifs narratifs, arcs émotionnels, points de tension).
Le plan doit être cohérent avec le pitch global et les chapitres existants.
Format : listes structurées, pas de prose inutile.${userPrompt ? `\n\nInstructions supplémentaires : ${userPrompt}` : ""}`,

    "expand-outline": `${ctx}

${chCtx}

Développe et enrichis le plan de ce chapitre. Ajoute des détails sur les scènes, dialogues clés, transitions et liens avec les chapitres adjacents.${userPrompt ? `\n\nInstructions : ${userPrompt}` : ""}`,

    "write-draft": `${ctx}

${chCtx}

Rédige un brouillon complet de ce chapitre à partir de son plan.
Style narratif adapté au genre. Longueur : environ 1500-2500 mots.
Respecte la voix et le ton établis dans les chapitres précédents.${userPrompt ? `\n\nInstructions : ${userPrompt}` : ""}`,

    revise: `${ctx}

${chCtx}

Révise le contenu de ce chapitre. Améliore la prose, le rythme, les dialogues et la cohérence interne.
Retourne le chapitre révisé complet, pas seulement les changements.${userPrompt ? `\n\nFocus de révision : ${userPrompt}` : ""}`,

    "check-coherence": `${ctx}

Analyse la cohérence globale de ce projet littéraire.

Évalue :
1. Alignement des chapitres avec le pitch et le synopsis
2. Continuité narrative (chronologie, personnages, lieux, faits)
3. Arcs narratifs et progression
4. Tonalité et style
5. Lacunes ou contradictions

Réponds UNIQUEMENT en JSON valide (sans markdown) avec cette structure :
{
  "score": <nombre 0-100>,
  "summary": "<résumé en 2-3 phrases>",
  "issues": [
    {
      "severity": "low"|"medium"|"high",
      "chapterId": "<id ou null>",
      "chapterTitle": "<titre ou null>",
      "description": "<description>"
    }
  ],
  "suggestions": ["<suggestion 1>", "<suggestion 2>"]
}`,

    "suggest-improvements": `${ctx}

${chCtx}

Propose des améliorations concrètes pour ce chapitre et son intégration dans l'ensemble du livre.
Structure ta réponse en sections : Points forts, Points à améliorer, Suggestions concrètes.${userPrompt ? `\n\nFocus : ${userPrompt}` : ""}`,
  };

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompts[action] },
  ];
}

function parseCoherenceJson(raw: string): NonNullable<AIResponse["coherenceReport"]> {
  const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned) as {
    score: number;
    summary: string;
    issues: CoherenceIssue[];
    suggestions: string[];
  };
  return {
    score: Math.min(100, Math.max(0, parsed.score ?? 0)),
    summary: parsed.summary ?? "",
    issues: parsed.issues ?? [],
    suggestions: parsed.suggestions ?? [],
  };
}

export async function runAIAction(
  project: BookProject,
  action: AIAction,
  chapter?: Chapter,
  userPrompt?: string
): Promise<AIResponse> {
  const messages = buildMessages(project, action, chapter, userPrompt);
  const temperature = action === "check-coherence" ? 0.3 : 0.7;

  const content = await chat(project.aiConfig, messages, {
    temperature,
    maxTokens: action === "write-draft" ? 8192 : 4096,
  });

  if (action === "check-coherence") {
    try {
      const coherenceReport = parseCoherenceJson(content);
      return {
        content: coherenceReport.summary,
        coherenceReport,
      };
    } catch {
      return { content };
    }
  }

  return { content };
}
