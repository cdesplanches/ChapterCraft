"use client";

import { useState } from "react";
import { Chapter, ChapterStatus } from "@/lib/types";
import { Button } from "./Button";
import { Input, Textarea, Select } from "./FormFields";
import { useLocale } from "@/contexts/LocaleContext";
import { resolveApiError } from "@/lib/api-error";

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

const AI_ACTION_KEYS: {
  key: AIActionKey;
  labelKey: string;
  target: "outline" | "content" | "none";
}[] = [
  { key: "generate-outline", labelKey: "aiActions.generateOutline", target: "outline" },
  { key: "expand-outline", labelKey: "aiActions.expandOutline", target: "outline" },
  { key: "write-draft", labelKey: "aiActions.writeDraft", target: "content" },
  { key: "revise", labelKey: "aiActions.revise", target: "content" },
  { key: "suggest-improvements", labelKey: "aiActions.suggestImprovements", target: "none" },
];

export function ChapterEditor({
  chapter,
  projectId,
  onUpdate,
  onDelete,
}: ChapterEditorProps) {
  const { t, te, locale } = useLocale();
  const [local, setLocal] = useState(chapter);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");

  const statusOptions = (
    ["outline", "draft", "revision", "done"] as ChapterStatus[]
  ).map((value) => ({
    value,
    label: t(`chapterStatus.${value}`),
  }));

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
        locale,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAiResult(`${t("chapter.errorPrefix")} ${resolveApiError(data, te)}`);
      setAiLoading(null);
      return;
    }

    const actionMeta = AI_ACTION_KEYS.find((a) => a.key === action);
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
            label={t("chapter.title")}
            value={local.title}
            onChange={(e) => setLocal({ ...local, title: e.target.value })}
            onBlur={() => local.title !== chapter.title && save({ title: local.title })}
          />
          <Select
            label={t("chapter.status")}
            value={local.status}
            onChange={(e) => {
              const status = e.target.value as ChapterStatus;
              setLocal({ ...local, status });
              save({ status });
            }}
            options={statusOptions}
          />
        </div>
        <Button variant="danger" size="sm" onClick={onDelete}>
          {t("common.delete")}
        </Button>
      </div>

      <Textarea
        label={t("chapter.outline")}
        value={local.outline}
        onChange={(e) => setLocal({ ...local, outline: e.target.value })}
        onBlur={() => local.outline !== chapter.outline && save({ outline: local.outline })}
        rows={8}
        className="font-mono text-sm"
      />

      <Textarea
        label={t("chapter.content")}
        value={local.content}
        onChange={(e) => setLocal({ ...local, content: e.target.value })}
        onBlur={() => local.content !== chapter.content && save({ content: local.content })}
        rows={20}
        className="leading-relaxed"
        placeholder={t("chapter.contentPlaceholder")}
      />

      <Textarea
        label={t("chapter.notes")}
        value={local.notes}
        onChange={(e) => setLocal({ ...local, notes: e.target.value })}
        onBlur={() => local.notes !== chapter.notes && save({ notes: local.notes })}
        rows={3}
        placeholder={t("chapter.notesPlaceholder")}
      />

      <div className="border-t border-border pt-6 space-y-4">
        <h4 className="font-medium text-sm">{t("chapter.aiAssist")}</h4>
        <Textarea
          label={t("chapter.optionalInstructions")}
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          rows={2}
          placeholder={t("chapter.instructionsPlaceholder")}
        />
        <div className="flex flex-wrap gap-2">
          {AI_ACTION_KEYS.map((action) => (
            <Button
              key={action.key}
              variant="secondary"
              size="sm"
              loading={aiLoading === action.key}
              disabled={!!aiLoading}
              onClick={() => runAI(action.key)}
            >
              {t(action.labelKey)}
            </Button>
          ))}
        </div>
        {aiResult && (
          <div className="p-4 rounded-lg bg-accent-light/50 text-sm whitespace-pre-wrap">
            {aiResult}
          </div>
        )}
      </div>

      {saving && <p className="text-xs text-muted">{t("common.saving")}</p>}
    </div>
  );
}
