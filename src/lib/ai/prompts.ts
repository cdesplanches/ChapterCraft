import { Locale } from "../i18n/types";
import { AIAction, BookProject, Chapter } from "../types";

const SYSTEM_PROMPTS: Record<Locale, string> = {
  en: `You are an expert literary assistant for writing novels and long-form books.
Write in English unless instructed otherwise.
You know narrative rules, act structure, character development, and internal story coherence.
Respond precisely and usefully, without unnecessary meta-commentary.`,
  fr: `Tu es un assistant littéraire expert en rédaction de romans et ouvrages longs.
Tu travailles en français sauf demande contraire.
Tu connais les règles narratives, la structure en actes, le développement des personnages et la cohérence interne d'un récit.
Réponds de manière précise et utile, sans commentaires meta inutiles.`,
  es: `Eres un asistente literario experto en la redacción de novelas y obras extensas.
Escribe en español salvo indicación contraria.
Conoces las reglas narrativas, la estructura en actos, el desarrollo de personajes y la coherencia interna de una historia.
Responde de forma precisa y útil, sin comentarios meta innecesarios.`,
};

const LABELS: Record<
  Locale,
  {
    empty: string;
    notSet: string;
    noChapters: string;
    none: string;
    chapter: string;
    project: string;
    pitch: string;
    synopsis: string;
    genre: string;
    audience: string;
    existingChapters: string;
    outline: string;
    content: string;
    authorNotes: string;
  }
> = {
  en: {
    empty: "(empty)",
    notSet: "(not set)",
    noChapters: "(no chapters)",
    none: "(none)",
    chapter: "Chapter",
    project: "Project",
    pitch: "Pitch",
    synopsis: "Synopsis",
    genre: "Genre",
    audience: "Target audience",
    existingChapters: "Existing chapters",
    outline: "Outline",
    content: "Current content",
    authorNotes: "Author notes",
  },
  fr: {
    empty: "(vide)",
    notSet: "(non renseigné)",
    noChapters: "(aucun chapitre)",
    none: "(aucune)",
    chapter: "Chapitre",
    project: "Projet",
    pitch: "Pitch",
    synopsis: "Synopsis",
    genre: "Genre",
    audience: "Public cible",
    existingChapters: "Chapitres existants",
    outline: "Plan",
    content: "Contenu actuel",
    authorNotes: "Notes de l'auteur",
  },
  es: {
    empty: "(vacío)",
    notSet: "(no indicado)",
    noChapters: "(ningún capítulo)",
    none: "(ninguna)",
    chapter: "Capítulo",
    project: "Proyecto",
    pitch: "Pitch",
    synopsis: "Sinopsis",
    genre: "Género",
    audience: "Público objetivo",
    existingChapters: "Capítulos existentes",
    outline: "Esquema",
    content: "Contenido actual",
    authorNotes: "Notas del autor",
  },
};

function truncate(text: string, max: number, emptyLabel: string): string {
  if (!text) return emptyLabel;
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

function projectContext(project: BookProject, locale: Locale): string {
  const l = LABELS[locale];
  const chapterSummaries = project.chapters
    .map(
      (c) =>
        `${l.chapter} ${c.number} — « ${c.title} » [${c.status}]\n${l.outline}: ${c.outline || l.empty}\n${l.content}: ${truncate(c.content, 800, l.empty)}`
    )
    .join("\n\n");

  return `# ${l.project}: ${project.title}

## ${l.pitch}
${project.pitch}

## ${l.synopsis}
${project.synopsis || l.notSet}

## ${l.genre}
${project.genre || l.notSet}

## ${l.audience}
${project.targetAudience || l.notSet}

## ${l.existingChapters}
${chapterSummaries || l.noChapters}`;
}

function chapterContext(chapter: Chapter, locale: Locale): string {
  const l = LABELS[locale];
  return `# ${l.chapter} ${chapter.number} — « ${chapter.title} »

## ${l.outline}
${chapter.outline || l.empty}

## ${l.content}
${chapter.content || l.empty}

## ${l.authorNotes}
${chapter.notes || l.none}`;
}

function actionPrompts(
  locale: Locale,
  userPrompt?: string
): Record<AIAction, string> {
  const extra = (label: string) =>
    userPrompt ? `\n\n${label}: ${userPrompt}` : "";

  const prompts: Record<Locale, Record<AIAction, string>> = {
    en: {
      "generate-outline": `Generate a detailed outline for this chapter (scene structure, narrative goals, emotional arcs, tension points).
The outline must be consistent with the global pitch and existing chapters.
Format: structured lists, no unnecessary prose.${extra("Additional instructions")}`,
      "expand-outline": `Develop and enrich this chapter's outline. Add details on scenes, key dialogue, transitions, and links with adjacent chapters.${extra("Instructions")}`,
      "write-draft": `Write a complete draft of this chapter from its outline.
Narrative style suited to the genre. Length: approximately 1500–2500 words.
Respect the voice and tone established in previous chapters.${extra("Instructions")}`,
      revise: `Revise this chapter's content. Improve prose, pacing, dialogue, and internal coherence.
Return the complete revised chapter, not just the changes.${extra("Revision focus")}`,
      assistant: `Act as a literary assistant for this chapter. Execute the following command on the chapter content.
IMPORTANT: Always return the COMPLETE, REFORMATTED chapter content as your response. Do not return a summary or excerpt.
If the user asks to reformat, improve, or transform the content, provide the full modified chapter text.
${extra("Command")}`,
      "check-coherence": `Analyze the global coherence of this literary project.

Evaluate:
1. Alignment of chapters with the pitch and synopsis
2. Narrative continuity (timeline, characters, locations, facts)
3. Story arcs and progression
4. Tone and style
5. Gaps or contradictions

Respond ONLY with valid JSON (no markdown) using this structure:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence summary>",
  "issues": [
    {
      "severity": "low"|"medium"|"high",
      "chapterId": "<id or null>",
      "chapterTitle": "<title or null>",
      "description": "<description>"
    }
  ],
  "suggestions": ["<suggestion 1>", "<suggestion 2>"]
}`,
      "suggest-improvements": `Suggest concrete improvements for this chapter and its integration into the book as a whole.
Structure your response in sections: Strengths, Areas to improve, Concrete suggestions.${extra("Focus")}`,
    },
    fr: {
      "generate-outline": `Génère un plan détaillé pour ce chapitre (structure en scènes, objectifs narratifs, arcs émotionnels, points de tension).
Le plan doit être cohérent avec le pitch global et les chapitres existants.
Format : listes structurées, pas de prose inutile.${extra("Instructions supplémentaires")}`,
      "expand-outline": `Développe et enrichis le plan de ce chapitre. Ajoute des détails sur les scènes, dialogues clés, transitions et liens avec les chapitres adjacents.${extra("Instructions")}`,
      "write-draft": `Rédige un brouillon complet de ce chapitre à partir de son plan.
Style narratif adapté au genre. Longueur : environ 1500-2500 mots.
Respecte la voix et le ton établis dans les chapitres précédents.${extra("Instructions")}`,
      revise: `Révise le contenu de ce chapitre. Améliore la prose, le rythme, les dialogues et la cohérence interne.
Retourne le chapitre révisé complet, pas seulement les changements.${extra("Focus de révision")}`,
      assistant: `Agis comme un assistant littéraire pour ce chapitre et exécute la commande suivante sur le contenu du chapitre.
IMPORTANT : Retourne TOUJOURS le CONTENU COMPLET ET REFORMATÉ du chapitre dans ta réponse. Ne renvoie pas un résumé ou un extrait.
Si l'utilisateur demande de reformatter, d'améliorer ou de transformer le contenu, fournis le texte du chapitre complet modifié.
${extra("Commande")}`,
      "check-coherence": `Analyse la cohérence globale de ce projet littéraire.

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
      "suggest-improvements": `Propose des améliorations concrètes pour ce chapitre et son intégration dans l'ensemble du livre.
Structure ta réponse en sections : Points forts, Points à améliorer, Suggestions concrètes.${extra("Focus")}`,
    },
    es: {
      "generate-outline": `Genera un esquema detallado para este capítulo (estructura de escenas, objetivos narrativos, arcos emocionales, puntos de tensión).
El esquema debe ser coherente con el pitch global y los capítulos existentes.
Formato: listas estructuradas, sin prosa innecesaria.${extra("Instrucciones adicionales")}`,
      "expand-outline": `Desarrolla y enriquece el esquema de este capítulo. Añade detalles sobre escenas, diálogos clave, transiciones y vínculos con capítulos adyacentes.${extra("Instrucciones")}`,
      "write-draft": `Escribe un borrador completo de este capítulo a partir de su esquema.
Estilo narrativo adaptado al género. Longitud: aproximadamente 1500-2500 palabras.
Respeta la voz y el tono establecidos en los capítulos anteriores.${extra("Instrucciones")}`,
      revise: `Revisa el contenido de este capítulo. Mejora la prosa, el ritmo, los diálogos y la coherencia interna.
Devuelve el capítulo revisado completo, no solo los cambios.${extra("Enfoque de revisión")}`,
      assistant: `Actúa como un asistente literario para este capítulo y ejecuta el siguiente comando en el contenido del capítulo.
IMPORTANTE: Siempre retorna el CONTENIDO COMPLETO Y REFORMATEADO del capítulo en tu respuesta. No devuelvas un resumen o extracto.
Si el usuario pide reformatear, mejorar o transformar el contenido, proporciona el texto completo modificado del capítulo.
${extra("Comando")}`,
      "check-coherence": `Analiza la coherencia global de este proyecto literario.

Evalúa:
1. Alineación de los capítulos con el pitch y la sinopsis
2. Continuidad narrativa (cronología, personajes, lugares, hechos)
3. Arcos narrativos y progresión
4. Tonalidad y estilo
5. Lagunas o contradicciones

Responde ÚNICAMENTE con JSON válido (sin markdown) con esta estructura:
{
  "score": <número 0-100>,
  "summary": "<resumen en 2-3 frases>",
  "issues": [
    {
      "severity": "low"|"medium"|"high",
      "chapterId": "<id o null>",
      "chapterTitle": "<título o null>",
      "description": "<descripción>"
    }
  ],
  "suggestions": ["<sugerencia 1>", "<sugerencia 2>"]
}`,
      "suggest-improvements": `Propón mejoras concretas para este capítulo y su integración en el conjunto del libro.
Estructura tu respuesta en secciones: Puntos fuertes, Puntos a mejorar, Sugerencias concretas.${extra("Enfoque")}`,
    },
  };

  return prompts[locale];
}

export function buildPromptMessages(
  project: BookProject,
  action: AIAction,
  locale: Locale,
  chapter?: Chapter,
  userPrompt?: string
) {
  const ctx = projectContext(project, locale);
  const chCtx = chapter ? chapterContext(chapter, locale) : "";
  const actionText = actionPrompts(locale, userPrompt)[action];

  const userContent = chapter
    ? `${ctx}\n\n${chCtx}\n\n${actionText}`
    : `${ctx}\n\n${actionText}`;

  return {
    system: SYSTEM_PROMPTS[locale],
    user: userContent,
  };
}

export const TEST_PROMPTS: Record<Locale, string> = {
  en: 'Reply with the word "OK" only.',
  fr: 'Réponds uniquement par le mot "OK".',
  es: 'Responde únicamente con la palabra "OK".',
};
