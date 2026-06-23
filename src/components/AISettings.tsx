"use client";

import { useEffect, useState, useCallback } from "react";
import { AIProviderConfig, AIProviderType } from "@/lib/types";
import { getActiveModelLabel, normalizeAiConfig } from "@/lib/ai-config";
import { Button } from "./Button";
import { Input, Select } from "./FormFields";
import { useLocale } from "@/contexts/LocaleContext";

interface AISettingsProps {
  config: AIProviderConfig;
  onSave: (config: AIProviderConfig) => Promise<void>;
}

function ProviderSection({
  title,
  hint,
  active,
  activeLabel,
  children,
}: {
  title: string;
  hint: string;
  active: boolean;
  activeLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border p-5 space-y-4 transition-colors ${
        active ? "border-accent/50 bg-accent-light/20" : "border-border bg-surface"
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">{title}</h4>
          {active && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
              {activeLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-muted mt-1">{hint}</p>
      </div>
      {children}
    </section>
  );
}

export function AISettings({ config, onSave }: AISettingsProps) {
  const { t, locale } = useLocale();
  const [local, setLocal] = useState<AIProviderConfig>(config);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message?: string;
    messageKey?: string;
  } | null>(null);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [modelsError, setModelsError] = useState("");

  const providerOptions: { value: AIProviderType; label: string }[] = [
    { value: "ollama", label: t("ai.providers.ollama") },
    { value: "openai", label: t("ai.providers.openai") },
    { value: "anthropic", label: t("ai.providers.anthropic") },
    { value: "gemini", label: t("ai.providers.gemini") },
    { value: "groq", label: t("ai.providers.groq") },
    { value: "openrouter", label: t("ai.providers.openrouter") },
  ];

  const loadOllamaModels = useCallback(async () => {
    setLoadingModels(true);
    setModelsError("");
    const url = local.ollamaBaseUrl ?? "http://localhost:11434";
    try {
      const res = await fetch(`/api/ai/test?ollamaUrl=${encodeURIComponent(url)}`);
      const data = await res.json();
      const models: string[] = data.models ?? [];
      setOllamaModels(models);
      if (models.length === 0) {
        setModelsError(t("ai.noModelsFound"));
      } else {
        setLocal((prev) => {
          if (prev.ollamaModel && models.includes(prev.ollamaModel)) return prev;
          return { ...prev, ollamaModel: models[0] };
        });
      }
    } catch {
      setModelsError(t("ai.modelsLoadFailed"));
      setOllamaModels([]);
    }
    setLoadingModels(false);
  }, [local.ollamaBaseUrl, t]);

  useEffect(() => {
    setLocal(config);
  }, [config]);

  useEffect(() => {
    if (local.ollamaBaseUrl) {
      loadOllamaModels();
    }
  }, [local.ollamaBaseUrl, loadOllamaModels]);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const normalized = normalizeAiConfig(local);
    const res = await fetch("/api/ai/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: normalized, locale }),
    });
    const data = await res.json();
    setTestResult(data);
    setTesting(false);
  }

  async function handleSave() {
    setSaving(true);
    const normalized = normalizeAiConfig(local);
    setLocal(normalized);
    await onSave(normalized);
    setSaving(false);
  }

  const testMessage =
    testResult?.messageKey === "connectionSuccess"
      ? t("ai.connectionSuccess")
      : testResult?.message;

  const activeModel = getActiveModelLabel(local);

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-accent-light/40 border border-accent/20 text-sm">
        <p className="font-medium">{t("ai.activeModel")}</p>
        <p className="text-muted mt-1">
          {t(`ai.providers.${local.type}`)} — <span className="font-mono">{activeModel}</span>
        </p>
      </div>

      <Select
        label={t("ai.activeProvider")}
        value={local.type}
        onChange={(e) =>
          setLocal({ ...local, type: e.target.value as AIProviderType })
        }
        options={providerOptions}
      />
      <p className="text-xs text-muted -mt-3">{t("ai.activeProviderHint")}</p>

      <div className="space-y-4">
        <ProviderSection
          title={t("ai.sections.ollama")}
          hint={t("ai.sections.ollamaHint")}
          active={local.type === "ollama"}
          activeLabel={t("ai.activeBadge")}
        >
          <Input
            label={t("ai.ollamaUrl")}
            value={local.ollamaBaseUrl ?? ""}
            onChange={(e) => setLocal({ ...local, ollamaBaseUrl: e.target.value })}
            onBlur={(e) =>
              setLocal((prev) => ({
                ...prev,
                ollamaBaseUrl: normalizeAiConfig({
                  ...prev,
                  ollamaBaseUrl: e.target.value,
                }).ollamaBaseUrl,
              }))
            }
            placeholder={t("ai.ollamaUrlPlaceholder")}
          />
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              {ollamaModels.length > 0 ? (
                <Select
                  label={t("ai.model")}
                  value={local.ollamaModel ?? ""}
                  onChange={(e) => setLocal({ ...local, ollamaModel: e.target.value })}
                  options={ollamaModels.map((m) => ({ value: m, label: m }))}
                />
              ) : (
                <Input
                  label={t("ai.model")}
                  value={local.ollamaModel ?? ""}
                  onChange={(e) => setLocal({ ...local, ollamaModel: e.target.value })}
                  placeholder="qwen2.5"
                />
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={loadOllamaModels}
              loading={loadingModels}
            >
              {t("ai.listModels")}
            </Button>
          </div>
          {modelsError && <p className="text-xs text-red-600">{modelsError}</p>}
          {ollamaModels.length > 0 && (
            <p className="text-xs text-muted">
              {t("ai.modelsAvailable", { count: ollamaModels.length })}
            </p>
          )}
        </ProviderSection>

        <ProviderSection
          title={t("ai.sections.openai")}
          hint={t("ai.sections.openaiHint")}
          active={local.type === "openai"}
          activeLabel={t("ai.activeBadge")}
        >
          <Input
            label={t("ai.openaiKey")}
            type="password"
            value={local.openaiApiKey ?? ""}
            onChange={(e) => setLocal({ ...local, openaiApiKey: e.target.value })}
            placeholder="sk-..."
            autoComplete="off"
          />
          <Input
            label={t("ai.model")}
            value={local.openaiModel ?? ""}
            onChange={(e) => setLocal({ ...local, openaiModel: e.target.value })}
            placeholder="gpt-4o"
          />
        </ProviderSection>

        <ProviderSection
          title={t("ai.sections.anthropic")}
          hint={t("ai.sections.anthropicHint")}
          active={local.type === "anthropic"}
          activeLabel={t("ai.activeBadge")}
        >
          <Input
            label={t("ai.anthropicKey")}
            type="password"
            value={local.anthropicApiKey ?? ""}
            onChange={(e) => setLocal({ ...local, anthropicApiKey: e.target.value })}
            placeholder="sk-ant-..."
            autoComplete="off"
          />
          <Input
            label={t("ai.model")}
            value={local.anthropicModel ?? ""}
            onChange={(e) => setLocal({ ...local, anthropicModel: e.target.value })}
            placeholder="claude-sonnet-4-20250514"
          />
        </ProviderSection>

        <ProviderSection
          title={t("ai.sections.gemini")}
          hint={t("ai.sections.geminiHint")}
          active={local.type === "gemini"}
          activeLabel={t("ai.activeBadge")}
        >
          <Input
            label={t("ai.geminiKey")}
            type="password"
            value={local.geminiApiKey ?? ""}
            onChange={(e) => setLocal({ ...local, geminiApiKey: e.target.value })}
            placeholder="AIz..."
            autoComplete="off"
          />
          <Input
            label={t("ai.model")}
            value={local.geminiModel ?? ""}
            onChange={(e) => setLocal({ ...local, geminiModel: e.target.value })}
            placeholder="gemini-2.0-flash"
          />
        </ProviderSection>

        <ProviderSection
          title={t("ai.sections.groq")}
          hint={t("ai.sections.groqHint")}
          active={local.type === "groq"}
          activeLabel={t("ai.activeBadge")}
        >
          <Input
            label={t("ai.groqKey")}
            type="password"
            value={local.groqApiKey ?? ""}
            onChange={(e) => setLocal({ ...local, groqApiKey: e.target.value })}
            placeholder="gsk_..."
            autoComplete="off"
          />
          <Input
            label={t("ai.model")}
            value={local.groqModel ?? ""}
            onChange={(e) => setLocal({ ...local, groqModel: e.target.value })}
            placeholder="mixtral-8x7b-32768"
          />
        </ProviderSection>

        <ProviderSection
          title={t("ai.sections.openrouter")}
          hint={t("ai.sections.openrouterHint")}
          active={local.type === "openrouter"}
          activeLabel={t("ai.activeBadge")}
        >
          <Input
            label={t("ai.openrouterKey")}
            type="password"
            value={local.openrouterApiKey ?? ""}
            onChange={(e) => setLocal({ ...local, openrouterApiKey: e.target.value })}
            placeholder="sk-or-..."
            autoComplete="off"
          />
          <Input
            label={t("ai.model")}
            value={local.openrouterModel ?? ""}
            onChange={(e) => setLocal({ ...local, openrouterModel: e.target.value })}
            placeholder="openrouter/auto"
          />
        </ProviderSection>
      </div>

      {testResult && (
        <p
          className={`text-sm p-3 rounded-lg ${testResult.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {testMessage}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={handleTest} loading={testing}>
          {t("ai.testConnection")}
        </Button>
        <Button type="button" onClick={handleSave} loading={saving}>
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}
