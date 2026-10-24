import { NextResponse } from "next/server";
import { listOpenCodeModels } from "@/lib/ai/providers";

export async function POST(request: Request) {
  const body = (await request.json()) as { apiKey?: string };
  const apiKey = body.apiKey?.trim();

  if (!apiKey) {
    return NextResponse.json({ error: "OPENCODE_KEY_MISSING" }, { status: 400 });
  }

  try {
    const models = await listOpenCodeModels(apiKey);
    return NextResponse.json({ models });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
