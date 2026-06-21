"use client";

import { useState } from "react";
import { Chapter, CHAPTER_STATUS_LABELS, ChapterStatus } from "@/lib/types";
import { Button } from "./Button";
import { Input, Textarea, Select } from "./FormFields";

interface ChapterEditorProps {
  chapter: Chapter;
  projectId: string;
  onUpdate: (chapter: Chapter) => void;
  onDelete: () => void;
}

type AIActionKey =
  | "generate-outline"
  | "expand-outline"
  | "write-draft"
  | "revise"
  | "suggest-improvements";

const AI_ACTIONS: { key: AIActionKey; label: string; target: "outline" | "content" | "none" }[] = [
  { key: "generate-outline", label: "Générer le plan", target: "outline" },
  { key: "expand-outline", label: "Enrichir le plan", target: "outline" },
  { key: "write-draft", label: "Rédiger le brouillon", target: "content" },
  { key: "revise", label: "Réviser", target: "content" },
  { key: "suggest-improvements", label: "Suggestions", target: "none" },
];

export function ChapterEditor({
  chapter,
  projectId,
  onUpdate,
  onDelete,
}: ChapterEditorProps) {
  const [local, setLocal] = useState(chapter);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");

  async function save(updates: Partial<Chapter>) {
    setSaving(true);
    const res = await fetch(
      `/api/projects/${projectId}/chapters/${chapter.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }
    );
    if (res.ok) {
      const updated = await res.json();
      setLocal(updated);
      onUpdate(updated);
    }
    setSaving(false);
  }

  async function runAI(action: AIActionKey) {
    setAiLoading(action);
    setAiResult("");
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        projectId,
        chapterId: chapter.id,
        userPrompt: aiPrompt || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAiResult(`Erreur : ${data.error}`);
      setAiLoading(null);
      return;
    }

    const actionMeta = AI_ACTIONS.find((a) => a.key === action);
    if (actionMeta?.target === "outline") {
      await save({ outline: data.content });
      setAiResult("");
    } else if (actionMeta?.target === "content") {
      await save({ content: data.content, status: "draft" as ChapterStatus });
      setAiResult("");
    } else {
      setAiResult(data.content);
    }
    setAiLoading(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-4">
          <Input
            label="Titre"
            value={local.title}
            onChange={(e) => setLocal({ ...local, title: e.target.value })}
            onBlur={() => local.title !== chapter.title && save({ title: local.title })}
          />
          <Select
            label="Statut"
            value={local.status}
            onChange={(e) => {
              const status = e.target.value as ChapterStatus;
              setLocal({ ...local, status });
              save({ status });
            }}
            options={Object.entries(CHAPTER_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </div>
        <Button variant="danger" size="sm" onClick={onDelete}>
          Supprimer
        </Button>
      </div>

      <Textarea
        label="Plan du chapitre"
        value={local.outline}
        onChange={(e) => setLocal({ ...local, outline: e.target.value })}
        onBlur={() => local.outline !== chapter.outline && save({ outline: local.outline })}
        rows={8}
        className="font-mono text-sm"
      />

      <Textarea
        label="Contenu"
        value={local.content}
        onChange={(e) => setLocal({ ...local, content: e.target.value })}
        onBlur={() => local.content !== chapter.content && save({ content: local.content })}
        rows={20}
        className="leading-relaxed"
        placeholder="Rédigez ou générez le contenu de votre chapitre..."
      />

      <Textarea
        label="Notes (privées)"
        value={local.notes}
        onChange={(e) => setLocal({ ...local, notes: e.target.value })}
        onBlur={() => local.notes !== chapter.notes && save({ notes: local.notes })}
        rows={3}
        placeholder="Notes pour vous-même..."
      />

      <div className="border-t border-border pt-6 space-y-4">
        <h4 className="font-medium text-sm">Assistance IA</h4>
        <Textarea
          label="Instructions optionnelles"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          rows={2}
          placeholder="Ex : accentuer le suspense, développer le personnage de Marie..."
        />
        <div className="flex flex-wrap gap-2">
          {AI_ACTIONS.map((action) => (
            <Button
              key={action.key}
              variant="secondary"
              size="sm"
              loading={aiLoading === action.key}
              disabled={!!aiLoading}
              onClick={() => runAI(action.key)}
            >
              {action.label}
            </Button>
          ))}
        </div>
        {aiResult && (
          <div className="p-4 rounded-lg bg-accent-light/50 text-sm whitespace-pre-wrap">
            {aiResult}
          </div>
        )}
      </div>

      {saving && (
        <p className="text-xs text-muted">Enregistrement…</p>
      )}
    </div>
  );
}
