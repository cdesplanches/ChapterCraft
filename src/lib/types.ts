export type AIProviderType = "ollama" | "openai" | "anthropic" | "gemini" | "groq" | "openrouter";

export interface AIProviderConfig {
  type: AIProviderType;
  /** Ollama base URL, e.g. http://localhost:11434 */
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  /** OpenAI API key */
  openaiApiKey?: string;
  openaiModel?: string;
  /** Anthropic API key */
  anthropicApiKey?: string;
  anthropicModel?: string;
  /** Google Gemini API key */
  geminiApiKey?: string;
  geminiModel?: string;
  /** Groq API key */
  groqApiKey?: string;
  groqModel?: string;
  /** OpenRouter API key */
  openrouterApiKey?: string;
  openrouterModel?: string;
}

export type ChapterStatus = "outline" | "draft" | "revision" | "done";

export interface Chapter {
  id: string;
  number: number;
  title: string;
  outline: string;
  content: string;
  status: ChapterStatus;
  notes: string;
  updatedAt: string;
}

export interface CoherenceReport {
  id: string;
  createdAt: string;
  score: number;
  summary: string;
  issues: CoherenceIssue[];
  suggestions: string[];
}

export interface CoherenceIssue {
  severity: "low" | "medium" | "high";
  chapterId?: string;
  chapterTitle?: string;
  description: string;
}

export interface BookProject {
  id: string;
  title: string;
  pitch: string;
  synopsis: string;
  genre: string;
  targetAudience: string;
  chapters: Chapter[];
  coherenceReports: CoherenceReport[];
  aiConfig: AIProviderConfig;
  createdAt: string;
  updatedAt: string;
}

export type AIAction =
  | "generate-outline"
  | "expand-outline"
  | "write-draft"
  | "revise"
  | "check-coherence"
  | "suggest-improvements";

export interface AIRequest {
  action: AIAction;
  projectId: string;
  chapterId?: string;
  userPrompt?: string;
}

export interface AIResponse {
  content: string;
  coherenceReport?: Omit<CoherenceReport, "id" | "createdAt">;
}

export const DEFAULT_AI_CONFIG: AIProviderConfig = {
  type: "ollama",
  ollamaBaseUrl: "http://localhost:11434",
  ollamaModel: "llama3.2",
  openaiModel: "gpt-4o",
  anthropicModel: "claude-sonnet-4-20250514",
  geminiModel: "gemini-2.0-flash",
  groqModel: "mixtral-8x7b-32768",
  openrouterModel: "openrouter/auto",
};
