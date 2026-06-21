import { NextResponse } from "next/server";
import { getProject, addCoherenceReport } from "@/lib/storage";
import { runAIAction } from "@/lib/ai/actions";
import { AIAction } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const { action, projectId, chapterId, userPrompt } = body as {
    action: AIAction;
    projectId: string;
    chapterId?: string;
    userPrompt?: string;
  };

  if (!action || !projectId) {
    return NextResponse.json(
      { error: "action et projectId sont requis" },
      { status: 400 }
    );
  }

  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const chapter = chapterId
    ? project.chapters.find((c) => c.id === chapterId)
    : undefined;

  if (chapterId && !chapter) {
    return NextResponse.json(
      { error: "Chapitre introuvable" },
      { status: 404 }
    );
  }

  const chapterRequired: AIAction[] = [
    "generate-outline",
    "expand-outline",
    "write-draft",
    "revise",
    "suggest-improvements",
  ];
  if (chapterRequired.includes(action) && !chapter) {
    return NextResponse.json(
      { error: "chapterId requis pour cette action" },
      { status: 400 }
    );
  }

  try {
    const result = await runAIAction(project, action, chapter, userPrompt);

    if (action === "check-coherence" && result.coherenceReport) {
      const report = await addCoherenceReport(projectId, result.coherenceReport);
      return NextResponse.json({ ...result, coherenceReport: report });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur IA";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
