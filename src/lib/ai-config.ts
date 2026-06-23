import { AIProviderConfig } from "./types";

/** Ensures Ollama URLs like `hal.local:11434` work as `http://hal.local:11434`. */
export function normalizeOllamaUrl(url?: string): string {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return "http://localhost:11434";
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withScheme.replace(/\/+$/, "");
}

export function getActiveModelLabel(config: AIProviderConfig): string {
  switch (config.type) {
    case "ollama":
      return config.ollamaModel ?? "llama3.2";
    case "openai":
      return config.openaiModel ?? "gpt-4o";
    case "anthropic":
      return config.anthropicModel ?? "claude-sonnet-4-20250514";
    case "gemini":
      return config.geminiModel ?? "gemini-2.0-flash";
    case "groq":
      return config.groqModel ?? "mixtral-8x7b-32768";
    case "openrouter":
      return config.openrouterModel ?? "openrouter/auto";
    default:
      return "—";
  }
}

export function normalizeAiConfig(config: AIProviderConfig): AIProviderConfig {
  return {
    ...config,
    ollamaBaseUrl: normalizeOllamaUrl(config.ollamaBaseUrl),
  };
}

export function mergeAiConfig(
  base: AIProviderConfig,
  override: Partial<AIProviderConfig>
): AIProviderConfig {
  return normalizeAiConfig({ ...base, ...override });
}
