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

function normalizeContentLine(line: string) {
  return line
    .replace(/^[—–]+\s*/, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([,.!?;:])\s*/g, "$1 ")
    .replace(/\s+([,.!?;:;])/g, "$1")
    .trim();
}

function isDialogueLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }

  if (/^["«“”‘’]/.test(trimmed)) {
    return true;
  }

  if (/^[-–—]\s*[A-Za-zÀ-ÖØ-öø-ÿ]/.test(trimmed)) {
    return true;
  }

  if (/^[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ'’\- ]{0,40}:\s+/.test(trimmed)) {
    return true;
  }

  return false;
}

function formatChapterContent(content: string) {
  const blocks = content.replace(/\r\n?/g, "\n").split(/\n{2,}/g);

  const formattedBlocks = blocks.map((block) => {
    const lines = block
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return "";
    }

    const dialogueLines = lines.filter(isDialogueLine).length;
    const isDialogueBlock = dialogueLines >= Math.ceil(lines.length / 2);

    if (isDialogueBlock) {
      return lines.map(normalizeContentLine).join("\n");
    }

    const paragraph = lines.map(normalizeContentLine).join(" ");
    return paragraph;
  });

  return formattedBlocks
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type AIActionKey =
  | "generate-outline"
  | "expand-outline"
  | "write-draft"
  | "revise"
  | "suggest-improvements"
  | "assistant";

const AI_ACTION_KEYS: {
  key: Exclude<AIActionKey, "assistant">;
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

  async function reformatContent() {
    const formatted = formatChapterContent(local.content);
    if (formatted === local.content) {
      return;
    }

    setLocal({ ...local, content: formatted });
    await save({ content: formatted });
  }

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

  async function applyAiResultToContent() {
    if (!aiResult.trim()) {
      return;
    }
    setLocal({ ...local, content: aiResult });
    await save({ content: aiResult, status: "draft" as ChapterStatus });
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
        labelAction={
          <Button
            variant="secondary"
            size="sm"
            onClick={reformatContent}
            disabled={saving || !!aiLoading}
          >
            {t("chapter.formatContent")}
          </Button>
        }
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
          <Button
            variant="secondary"
            size="sm"
            loading={aiLoading === "assistant"}
            disabled={!!aiLoading || !aiPrompt.trim()}
            onClick={() => runAI("assistant")}
          >
            {t("chapter.sendAiPrompt")}
          </Button>
        </div>
        {aiResult && (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-accent-light/50 text-sm whitespace-pre-wrap">
              {aiResult}
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={applyAiResultToContent}
                disabled={!aiResult.trim() || !!aiLoading}
              >
                {t("chapter.applyAiResult")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {saving && <p className="text-xs text-muted">{t("common.saving")}</p>}
    </div>
  );
}
