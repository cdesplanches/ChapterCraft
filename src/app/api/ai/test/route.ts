import { NextResponse } from "next/server";
import { testConnection, listOllamaModels } from "@/lib/ai/providers";
import { AIProviderConfig } from "@/lib/types";

export async function POST(request: Request) {
  const config = (await request.json()) as AIProviderConfig;
  const result = await testConnection(config);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const baseUrl = searchParams.get("ollamaUrl") ?? "http://localhost:11434";
  const models = await listOllamaModels(baseUrl);
  return NextResponse.json({ models });
}
