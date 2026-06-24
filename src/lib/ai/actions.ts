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

  // Action-specific defaults for token budget and preferred Groq model
  const ACTION_DEFAULTS: Record<AIAction, { defaultMaxTokens: number; groqModel?: string }> = {
    "generate-outline": { defaultMaxTokens: 512 },
    "expand-outline": { defaultMaxTokens: 1024 },
    "write-draft": { defaultMaxTokens: 4096, groqModel: "mixtral-8x7b-32768" },
    revise: { defaultMaxTokens: 2048 },
    "check-coherence": { defaultMaxTokens: 400 },
    "suggest-improvements": { defaultMaxTokens: 800 },
    assistant: { defaultMaxTokens: 2048 },
  };

  const actionDefaults = ACTION_DEFAULTS[action] || { defaultMaxTokens: 1024 };

  // prepare provider config: allow action to pick preferred model for Groq
  const cfg = { ...project.aiConfig } as typeof project.aiConfig;
  if (cfg.type === "groq" && actionDefaults.groqModel) {
    cfg.groqModel = actionDefaults.groqModel;
  }

  const content = await chat(cfg, messages, {
    temperature,
    maxTokens: actionDefaults.defaultMaxTokens,
    action,
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
