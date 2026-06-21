import { NextResponse } from "next/server";
import { getAppSettings, updateAppSettings } from "@/lib/settings-storage";
import { AIProviderConfig } from "@/lib/types";

export async function GET() {
  const settings = await getAppSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { aiConfig } = body as { aiConfig: AIProviderConfig };

  if (!aiConfig?.type) {
    return NextResponse.json({ errorKey: "invalidAiConfig" }, { status: 400 });
  }

  const settings = await updateAppSettings(aiConfig);
  return NextResponse.json(settings);
}
