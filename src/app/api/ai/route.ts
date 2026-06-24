import { NextResponse } from "next/server";
import { getProject, addCoherenceReport } from "@/lib/storage";
import { getGlobalAiConfig } from "@/lib/settings-storage";
import { mergeAiConfig } from "@/lib/ai-config";
import { runAIAction } from "@/lib/ai/actions";
import { AIAction } from "@/lib/types";
import { DEFAULT_LOCALE, Locale } from "@/lib/i18n/types";

function parseLocale(value: unknown): Locale {
  if (value === "en" || value === "fr" || value === "es") return value;
  return DEFAULT_LOCALE;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, projectId, chapterId, userPrompt, locale } = body as {
    action: AIAction;
    projectId: string;
    chapterId?: string;
    userPrompt?: string;
    locale?: Locale;
  };

  if (!action || !projectId) {
    return NextResponse.json(
      { errorKey: "actionAndProjectRequired" },
      { status: 400 }
    );
  }

  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ errorKey: "projectNotFound" }, { status: 404 });
  }

  const chapter = chapterId
    ? project.chapters.find((c) => c.id === chapterId)
    : undefined;

  if (chapterId && !chapter) {
    return NextResponse.json({ errorKey: "chapterNotFound" }, { status: 404 });
  }

  const chapterRequired: AIAction[] = [
    "generate-outline",
    "expand-outline",
    "write-draft",
    "revise",
    "suggest-improvements",
    "assistant",
  ];
  if (chapterRequired.includes(action) && !chapter) {
    return NextResponse.json({ errorKey: "chapterIdRequired" }, { status: 400 });
  }

  try {
    const globalConfig = await getGlobalAiConfig();
    const projectForAi = {
      ...project,
      aiConfig: mergeAiConfig(project.aiConfig, globalConfig),
    };

    const result = await runAIAction(
      projectForAi,
      action,
      parseLocale(locale),
      chapter,
      userPrompt
    );

    if (action === "check-coherence" && result.coherenceReport) {
      const report = await addCoherenceReport(projectId, result.coherenceReport);
      return NextResponse.json({ ...result, coherenceReport: report });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, errorKey: "aiError" }, { status: 502 });
  }
}
