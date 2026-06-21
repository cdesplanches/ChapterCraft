import { NextResponse } from "next/server";
import { testConnection, listOllamaModels } from "@/lib/ai/providers";
import { AIProviderConfig } from "@/lib/types";
import { DEFAULT_LOCALE, Locale } from "@/lib/i18n/types";

function parseLocale(value: unknown): Locale {
  if (value === "en" || value === "fr" || value === "es") return value;
  return DEFAULT_LOCALE;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { config, locale } = body as {
    config: AIProviderConfig;
    locale?: Locale;
  };
  const result = await testConnection(config, parseLocale(locale));
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const baseUrl = searchParams.get("ollamaUrl") ?? "http://localhost:11434";
  const models = await listOllamaModels(baseUrl);
  return NextResponse.json({ models });
}
