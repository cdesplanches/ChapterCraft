import { AIProviderConfig } from "../types";
import { Locale, DEFAULT_LOCALE } from "../i18n/types";
import { TEST_PROMPTS } from "./prompts";
import { normalizeOllamaUrl } from "../ai-config";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  action?: string;
}

// Simple token estimation helper (heuristic): ~4 characters per token
function estimateTokensFromChars(charCount: number) {
  return Math.ceil(charCount / 4);
}

function joinMessagesContent(messages: ChatMessage[]) {
  return messages.map((m) => m.content || "").join("\n\n");
}

function shrinkMessagesToFit(messages: ChatMessage[], maxInputTokens: number) {
  const joined = joinMessagesContent(messages);
  const totalChars = joined.length;
  const totalTokens = estimateTokensFromChars(totalChars);
  if (totalTokens <= maxInputTokens) return messages;

  // target chars allowed
  const targetChars = Math.max(0, Math.floor(maxInputTokens * 4));

  // Heuristic: keep system message intact, truncate the longest user messages first
  const sys = messages.filter((m) => m.role === "system");
  const others = messages.filter((m) => m.role !== "system");

  // Sort others by length desc
  const sorted = [...others].sort((a, b) => b.content.length - a.content.length);

  // Trim each message proportionally until under target
  let remainingChars = targetChars - joinMessagesContent(sys).length;
  if (remainingChars < 0) remainingChars = 0;

  const resultOthers: ChatMessage[] = [];
  const totalOtherChars = sorted.reduce((s, m) => s + m.content.length, 0) || 1;

  for (const m of sorted) {
    const share = Math.floor((m.content.length / totalOtherChars) * remainingChars);
    const trimmed = m.content.length > share ? m.content.slice(0, Math.max(0, share - 3)) + "…" : m.content;
    resultOthers.push({ ...m, content: trimmed });
  }

  // Return messages in original order but with trimmed contents
  const trimmedMap = new Map(resultOthers.map((m) => [m.content, m]));
  return messages.map((m) => {
    if (m.role === "system") return m;
    // find corresponding trimmed by matching original prefix or fallback to truncated
    const found = resultOthers.find((r) => r.role === m.role && r.content.startsWith(m.content.slice(0, 20)));
    return found ?? resultOthers.shift() ?? { ...m, content: m.content.slice(0, Math.max(0, Math.floor(remainingChars / Math.max(1, others.length)) - 3)) + "…" };
  });
}

function summarizeText(text: string, mode: "short" | "medium" = "short") {
  if (!text) return "";
  const maxSentences = mode === "short" ? 2 : 4;
  // crude sentence split
  const sentences = text.match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()) ?? [];
  if (sentences.length === 0) {
    return text.slice(0, mode === "short" ? 200 : 400) + (text.length > (mode === "short" ? 200 : 400) ? "…" : "");
  }
  const take = sentences.slice(0, maxSentences).join(" ");
  if (take.length > (mode === "short" ? 300 : 800)) {
    return take.slice(0, mode === "short" ? 300 : 800) + "…";
  }
  return take;
}

function summarizeMessages(messages: ChatMessage[], mode: "short" | "medium" = "short") {
  return messages.map((m) => {
    if (m.role === "system") return m;
    if ((m.content || "").length > (mode === "short" ? 800 : 1600)) {
      return { ...m, content: summarizeText(m.content, mode) };
    }
    return m;
  });
}

export async function chat(
  config: AIProviderConfig,
  messages: ChatMessage[],
  options: LLMOptions = {}
): Promise<string> {
  switch (config.type) {
    case "ollama":
      return chatOllama(config, messages, options);
    case "openai":
      return chatOpenAI(config, messages, options);
    case "anthropic":
      return chatAnthropic(config, messages, options);
    case "gemini":
      return chatGemini(config, messages, options);
    case "groq":
      return chatGroq(config, messages, options);
    case "openrouter":
      return chatOpenRouter(config, messages, options);
    default:
      throw new Error(`Unknown provider: ${config.type}`);
  }
}

async function chatOllama(
  config: AIProviderConfig,
  messages: ChatMessage[],
  options: LLMOptions
): Promise<string> {
  const baseUrl = normalizeOllamaUrl(config.ollamaBaseUrl);
  const model = config.ollamaModel ?? "llama3.2";

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens ?? 4096,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama (${res.status}): ${err}`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content ?? "";
}

async function chatOpenAI(
  config: AIProviderConfig,
  messages: ChatMessage[],
  options: LLMOptions
): Promise<string> {
  if (!config.openaiApiKey) {
    throw new Error("OPENAI_KEY_MISSING");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: config.openaiModel ?? "gpt-4o",
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI (${res.status}): ${err}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

async function chatAnthropic(
  config: AIProviderConfig,
  messages: ChatMessage[],
  options: LLMOptions
): Promise<string> {
  if (!config.anthropicApiKey) {
    throw new Error("ANTHROPIC_KEY_MISSING");
  }

  const systemMessage = messages.find((m) => m.role === "system");
  const nonSystemMessages = messages.filter((m) => m.role !== "system");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.anthropicModel ?? "claude-sonnet-4-20250514",
      max_tokens: options.maxTokens ?? 4096,
      system: systemMessage?.content,
      messages: nonSystemMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic (${res.status}): ${err}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  return data.content?.find((c) => c.type === "text")?.text ?? "";
}

async function chatGemini(
  config: AIProviderConfig,
  messages: ChatMessage[],
  options: LLMOptions
): Promise<string> {
  if (!config.geminiApiKey) {
    throw new Error("GEMINI_KEY_MISSING");
  }

  const systemMessage = messages.find((m) => m.role === "system");
  const nonSystemMessages = messages.filter((m) => m.role !== "system");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel ?? "gemini-2.0-flash"}:generateContent?key=${config.geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: systemMessage?.content
          ? { parts: [{ text: systemMessage.content }] }
          : undefined,
        contents: nonSystemMessages.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 4096,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini (${res.status}): ${err}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
  );
}

async function chatGroq(
  config: AIProviderConfig,
  messages: ChatMessage[],
  options: LLMOptions
): Promise<string> {
  if (!config.groqApiKey) {
    throw new Error("GROQ_KEY_MISSING");
  }
  // Groq (and other providers) can fail when the total requested tokens (input + output)
  // exceed account/model limits. Use a conservative default limit and shrink messages if needed.
  const DEFAULT_GROQ_TOKEN_LIMIT = 6000; // conservative default (tokens per minute / request budget)
  let requestedOutputTokens = options.maxTokens ?? 4096;

  // Estimate input tokens
  const inputChars = joinMessagesContent(messages).length;
  let inputTokens = estimateTokensFromChars(inputChars);

  // If total input+output exceeds the model limit, first try to reduce the requested output tokens
  const MIN_OUTPUT_TOKENS = 128;
  let safeMessages = messages;
  if (inputTokens + requestedOutputTokens > DEFAULT_GROQ_TOKEN_LIMIT) {
    // First, try to reduce requested output tokens
    const allowedOutput = Math.max(MIN_OUTPUT_TOKENS, DEFAULT_GROQ_TOKEN_LIMIT - inputTokens - 100);
    if (allowedOutput < requestedOutputTokens) {
      requestedOutputTokens = allowedOutput;
    }

    // If still too large, try summarizing long messages (short summary)
    // But skip summarization for 'assistant' action as it needs full content to reformat/improve
    if (inputTokens + requestedOutputTokens > DEFAULT_GROQ_TOKEN_LIMIT && options.action !== "assistant") {
      const summarized = summarizeMessages(messages, "short");
      const summarizedInputTokens = estimateTokensFromChars(joinMessagesContent(summarized).length);
      if (summarizedInputTokens + requestedOutputTokens <= DEFAULT_GROQ_TOKEN_LIMIT) {
        safeMessages = summarized;
        inputTokens = summarizedInputTokens;
      } else {
        // Otherwise, aggressively shrink input messages
        const targetInputTokens = Math.max(0, DEFAULT_GROQ_TOKEN_LIMIT - requestedOutputTokens - 50);
        safeMessages = shrinkMessagesToFit(messages, targetInputTokens);
        // recompute input tokens after shrinking
        inputTokens = estimateTokensFromChars(joinMessagesContent(safeMessages).length);

        // as a last resort, if still too large, reduce requested output further
        if (inputTokens + requestedOutputTokens > DEFAULT_GROQ_TOKEN_LIMIT) {
          requestedOutputTokens = Math.max(MIN_OUTPUT_TOKENS, DEFAULT_GROQ_TOKEN_LIMIT - inputTokens - 10);
        }
      }
    } else if (inputTokens + requestedOutputTokens > DEFAULT_GROQ_TOKEN_LIMIT) {
      // For 'assistant' action, only use aggressive truncation, no summarization
      const targetInputTokens = Math.max(0, DEFAULT_GROQ_TOKEN_LIMIT - requestedOutputTokens - 50);
      safeMessages = shrinkMessagesToFit(messages, targetInputTokens);
      inputTokens = estimateTokensFromChars(joinMessagesContent(safeMessages).length);

      if (inputTokens + requestedOutputTokens > DEFAULT_GROQ_TOKEN_LIMIT) {
        requestedOutputTokens = Math.max(MIN_OUTPUT_TOKENS, DEFAULT_GROQ_TOKEN_LIMIT - inputTokens - 10);
      }
    }
  }

  // Retry loop with exponential backoff for rate limit errors
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.groqApiKey}`,
      },
      body: JSON.stringify({
        model: config.groqModel ?? "mixtral-8x7b-32768",
        messages: safeMessages,
        temperature: options.temperature ?? 0.7,
        max_tokens: requestedOutputTokens,
      }),
    });

    const text = await res.text();
    if (res.ok) {
      try {
        const data = JSON.parse(text) as { choices?: { message?: { content?: string } }[] };
        return data.choices?.[0]?.message?.content ?? "";
      } catch {
        return text;
      }
    }

    // Handle common rate-limit / token errors: retry with backoff, else throw
    const status = res.status;
    const body = text || "";
    const isRateLimit = status === 429 || /rate_limit|tokens per minute|TPM|Requested\s+\d+/i.test(body);
    if (isRateLimit && attempt < maxAttempts) {
      const backoffMs = Math.pow(2, attempt) * 500;
      await new Promise((r) => setTimeout(r, backoffMs));
      continue;
    }

    throw new Error(`Groq (${status}): ${body}`);
  }

  throw new Error("Groq: failed after retries");
}

async function chatOpenRouter(
  config: AIProviderConfig,
  messages: ChatMessage[],
  options: LLMOptions
): Promise<string> {
  if (!config.openrouterApiKey) {
    throw new Error("OPENROUTER_KEY_MISSING");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openrouterApiKey}`,
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://chaptercraft.app",
    },
    body: JSON.stringify({
      model: config.openrouterModel ?? "openrouter/auto",
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter (${res.status}): ${err}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

export async function testConnection(
  config: AIProviderConfig,
  locale: Locale = DEFAULT_LOCALE
): Promise<{ ok: boolean; message?: string; messageKey?: "connectionSuccess" }> {
  try {
    const response = await chat(
      config,
      [{ role: "user", content: TEST_PROMPTS[locale] }],
      { maxTokens: 10, temperature: 0 }
    );
    return {
      ok: true,
      message: response.trim() || undefined,
      messageKey: "connectionSuccess",
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function listOllamaModels(
  baseUrl: string
): Promise<string[]> {
  try {
    const url = normalizeOllamaUrl(baseUrl);
    const res = await fetch(`${url}/api/tags`);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      models?: { name: string }[];
    };
    return data.models?.map((m) => m.name) ?? [];
  } catch {
    return [];
  }
}
