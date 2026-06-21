"use client";

import { useState } from "react";
import { AIProviderConfig, AIProviderType } from "@/lib/types";
import { Button } from "./Button";
import { Input, Select } from "./FormFields";

interface AISettingsProps {
  config: AIProviderConfig;
  onSave: (config: AIProviderConfig) => Promise<void>;
}

const PROVIDERS: { value: AIProviderType; label: string }[] = [
  { value: "ollama", label: "Ollama (local)" },
  { value: "openai", label: "OpenAI (ChatGPT)" },
  { value: "anthropic", label: "Anthropic (Claude)" },
];

export function AISettings({ config, onSave }: AISettingsProps) {
  const [local, setLocal] = useState<AIProviderConfig>(config);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/ai/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(local),
    });
    const data = await res.json();
    setTestResult(data);
    setTesting(false);
  }

  async function loadOllamaModels() {
    const url = local.ollamaBaseUrl ?? "http://localhost:11434";
    const res = await fetch(`/api/ai/test?ollamaUrl=${encodeURIComponent(url)}`);
    const data = await res.json();
    setOllamaModels(data.models ?? []);
  }

  async function handleSave() {
    setSaving(true);
    await onSave(local);
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      <Select
        label="Fournisseur IA"
        value={local.type}
        onChange={(e) =>
          setLocal({ ...local, type: e.target.value as AIProviderType })
        }
        options={PROVIDERS}
      />

      {local.type === "ollama" && (
        <>
          <Input
            label="URL Ollama"
            value={local.ollamaBaseUrl ?? ""}
            onChange={(e) => setLocal({ ...local, ollamaBaseUrl: e.target.value })}
            placeholder="http://localhost:11434"
          />
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              {ollamaModels.length > 0 ? (
                <Select
                  label="Modèle"
                  value={local.ollamaModel ?? ""}
                  onChange={(e) => setLocal({ ...local, ollamaModel: e.target.value })}
                  options={ollamaModels.map((m) => ({ value: m, label: m }))}
                />
              ) : (
                <Input
                  label="Modèle"
                  value={local.ollamaModel ?? ""}
                  onChange={(e) => setLocal({ ...local, ollamaModel: e.target.value })}
                  placeholder="llama3.2"
                />
              )}
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={loadOllamaModels}>
              Lister
            </Button>
          </div>
        </>
      )}

      {local.type === "openai" && (
        <>
          <Input
            label="Clé API OpenAI"
            type="password"
            value={local.openaiApiKey ?? ""}
            onChange={(e) => setLocal({ ...local, openaiApiKey: e.target.value })}
            placeholder="sk-..."
          />
          <Input
            label="Modèle"
            value={local.openaiModel ?? ""}
            onChange={(e) => setLocal({ ...local, openaiModel: e.target.value })}
            placeholder="gpt-4o"
          />
        </>
      )}

      {local.type === "anthropic" && (
        <>
          <Input
            label="Clé API Anthropic"
            type="password"
            value={local.anthropicApiKey ?? ""}
            onChange={(e) => setLocal({ ...local, anthropicApiKey: e.target.value })}
            placeholder="sk-ant-..."
          />
          <Input
            label="Modèle"
            value={local.anthropicModel ?? ""}
            onChange={(e) => setLocal({ ...local, anthropicModel: e.target.value })}
            placeholder="claude-sonnet-4-20250514"
          />
        </>
      )}

      {testResult && (
        <p
          className={`text-sm p-3 rounded-lg ${testResult.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {testResult.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={handleTest} loading={testing}>
          Tester la connexion
        </Button>
        <Button type="button" onClick={handleSave} loading={saving}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
