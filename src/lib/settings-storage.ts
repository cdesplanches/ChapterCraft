import { AIProviderConfig, DEFAULT_AI_CONFIG } from "./types";
import { normalizeAiConfig } from "./ai-config";
import {
  getStorageBackend,
  getStorageUserId,
  userKey,
} from "./storage/context";
import { FsStorageBackend } from "./storage/fs-backend";

export interface AppSettings {
  aiConfig: AIProviderConfig;
  updatedAt: string;
}

function settingsKey(userId: string) {
  return userKey(userId, "settings.json");
}

async function readSettingsRaw(userId: string): Promise<string | null> {
  const backend = await getStorageBackend();
  const key = settingsKey(userId);
  let raw = await backend.read(key);
  if (!raw && backend instanceof FsStorageBackend) {
    raw = await backend.read("settings.json");
  }
  return raw;
}

export async function getAppSettings(): Promise<AppSettings> {
  const userId = await getStorageUserId();
  try {
    const raw = await readSettingsRaw(userId);
    if (!raw) {
      return defaultSettings();
    }
    const parsed = JSON.parse(raw) as AppSettings;
    return {
      ...parsed,
      aiConfig: normalizeAiConfig(parsed.aiConfig ?? DEFAULT_AI_CONFIG),
    };
  } catch {
    return defaultSettings();
  }
}

function defaultSettings(): AppSettings {
  return {
    aiConfig: normalizeAiConfig({ ...DEFAULT_AI_CONFIG }),
    updatedAt: new Date().toISOString(),
  };
}

export async function getGlobalAiConfig(): Promise<AIProviderConfig> {
  const settings = await getAppSettings();
  return settings.aiConfig;
}

export async function updateAppSettings(
  aiConfig: AIProviderConfig
): Promise<AppSettings> {
  const userId = await getStorageUserId();
  const backend = await getStorageBackend();
  const settings: AppSettings = {
    aiConfig: normalizeAiConfig(aiConfig),
    updatedAt: new Date().toISOString(),
  };
  await backend.write(settingsKey(userId), JSON.stringify(settings, null, 2));
  return settings;
}
