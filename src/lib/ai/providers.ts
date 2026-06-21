import { AIProviderConfig } from "../types";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
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
    default:
      throw new Error(`Provider inconnu: ${config.type}`);
  }
}

async function chatOllama(
  config: AIProviderConfig,
  messages: ChatMessage[],
  options: LLMOptions
): Promise<string> {
  const baseUrl = config.ollamaBaseUrl ?? "http://localhost:11434";
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
    throw new Error("Clé API OpenAI non configurée");
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
    throw new Error("Clé API Anthropic non configurée");
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

export async function testConnection(
  config: AIProviderConfig
): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await chat(
      config,
      [
        {
          role: "user",
          content: 'Réponds uniquement par le mot "OK".',
        },
      ],
      { maxTokens: 10, temperature: 0 }
    );
    return {
      ok: true,
      message: response.trim() || "Connexion réussie",
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}

export async function listOllamaModels(
  baseUrl: string
): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      models?: { name: string }[];
    };
    return data.models?.map((m) => m.name) ?? [];
  } catch {
    return [];
  }
}
