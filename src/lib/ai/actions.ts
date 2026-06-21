import { chat, ChatMessage } from "./providers";
import { buildPromptMessages } from "./prompts";
import { Locale, DEFAULT_LOCALE } from "../i18n/types";
import {
  AIAction,
  AIResponse,
  BookProject,
  Chapter,
  CoherenceIssue,
} from "../types";

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
  locale: Locale = DEFAULT_LOCALE,
  chapter?: Chapter,
  userPrompt?: string
): Promise<AIResponse> {
  const { system, user } = buildPromptMessages(
    project,
    action,
    locale,
    chapter,
    userPrompt
  );

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

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
