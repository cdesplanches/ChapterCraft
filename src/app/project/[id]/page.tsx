"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/FormFields";
import { ChapterEditor } from "@/components/ChapterEditor";
import { AISettings } from "@/components/AISettings";
import { CoherencePanel } from "@/components/CoherencePanel";
import {
  BookProject,
  AIProviderConfig,
  CHAPTER_STATUS_LABELS,
} from "@/lib/types";

type Tab = "chapters" | "pitch" | "coherence" | "settings";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<BookProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("chapters");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [coherenceLoading, setCoherenceLoading] = useState(false);
  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) {
      router.push("/");
      return;
    }
    const data = await res.json();
    setProject(data);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (project?.chapters.length && !selectedChapterId) {
      setSelectedChapterId(project.chapters[0].id);
    }
  }, [project, selectedChapterId]);

  async function updateProject(updates: Partial<BookProject>) {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setProject(updated);
    }
  }

  async function addChapter() {
    if (!newChapterTitle.trim()) return;
    setAddingChapter(true);
    const res = await fetch(`/api/projects/${id}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newChapterTitle.trim() }),
    });
    if (res.ok) {
      const chapter = await res.json();
      await load();
      setSelectedChapterId(chapter.id);
      setNewChapterTitle("");
    }
    setAddingChapter(false);
  }

  async function deleteChapter(chapterId: string) {
    if (!confirm("Supprimer ce chapitre ?")) return;
    await fetch(`/api/projects/${id}/chapters/${chapterId}`, { method: "DELETE" });
    if (selectedChapterId === chapterId) setSelectedChapterId(null);
    await load();
  }

  async function checkCoherence() {
    setCoherenceLoading(true);
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check-coherence", projectId: id }),
    });
    if (res.ok) await load();
    setCoherenceLoading(false);
  }

  async function saveAIConfig(config: AIProviderConfig) {
    await updateProject({ aiConfig: config });
  }

  if (loading || !project) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-muted">Chargement…</p>
        </main>
      </>
    );
  }

  const selectedChapter = project.chapters.find((c) => c.id === selectedChapterId);

  const tabs: { key: Tab; label: string }[] = [
    { key: "chapters", label: "Chapitres" },
    { key: "pitch", label: "Pitch & Synopsis" },
    { key: "coherence", label: "Cohérence" },
    { key: "settings", label: "IA" },
  ];

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <Link href="/" className="text-sm text-muted hover:text-accent">
            ← Retour aux projets
          </Link>
          <h2 className="text-2xl font-semibold mt-2">{project.title}</h2>
          <p className="text-sm text-muted mt-1 line-clamp-1">{project.pitch}</p>
        </div>

        <nav className="flex gap-1 border-b border-border mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.key
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "chapters" && (
          <div className="grid grid-cols-12 gap-6">
            <aside className="col-span-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Nouveau chapitre…"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addChapter()}
                />
                <Button size="sm" onClick={addChapter} loading={addingChapter}>
                  +
                </Button>
              </div>
              <ul className="space-y-1">
                {project.chapters.map((ch) => (
                  <li key={ch.id}>
                    <button
                      onClick={() => setSelectedChapterId(ch.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        selectedChapterId === ch.id
                          ? "bg-accent-light text-accent font-medium"
                          : "hover:bg-surface-hover text-foreground"
                      }`}
                    >
                      <span className="text-muted mr-1">{ch.number}.</span>
                      {ch.title}
                      <span className="block text-xs text-muted mt-0.5">
                        {CHAPTER_STATUS_LABELS[ch.status]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {project.chapters.length === 0 && (
                <p className="text-sm text-muted">Ajoutez votre premier chapitre.</p>
              )}
            </aside>

            <section className="col-span-9 p-6 rounded-xl border border-border bg-surface min-h-[600px]">
              {selectedChapter ? (
                <ChapterEditor
                  key={selectedChapter.id}
                  chapter={selectedChapter}
                  projectId={project.id}
                  onUpdate={(ch) => {
                    setProject({
                      ...project,
                      chapters: project.chapters.map((c) =>
                        c.id === ch.id ? ch : c
                      ),
                    });
                  }}
                  onDelete={() => deleteChapter(selectedChapter.id)}
                />
              ) : (
                <p className="text-muted text-center py-20">
                  Sélectionnez ou créez un chapitre pour commencer.
                </p>
              )}
            </section>
          </div>
        )}

        {tab === "pitch" && (
          <div className="max-w-2xl space-y-5 p-6 rounded-xl border border-border bg-surface">
            <Input
              label="Titre"
              defaultValue={project.title}
              onBlur={(e) =>
                e.target.value !== project.title &&
                updateProject({ title: e.target.value })
              }
            />
            <Textarea
              label="Pitch"
              defaultValue={project.pitch}
              rows={4}
              onBlur={(e) =>
                e.target.value !== project.pitch &&
                updateProject({ pitch: e.target.value })
              }
            />
            <Textarea
              label="Synopsis"
              defaultValue={project.synopsis}
              rows={8}
              onBlur={(e) =>
                e.target.value !== project.synopsis &&
                updateProject({ synopsis: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Genre"
                defaultValue={project.genre}
                onBlur={(e) =>
                  e.target.value !== project.genre &&
                  updateProject({ genre: e.target.value })
                }
              />
              <Input
                label="Public cible"
                defaultValue={project.targetAudience}
                onBlur={(e) =>
                  e.target.value !== project.targetAudience &&
                  updateProject({ targetAudience: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {tab === "coherence" && (
          <div className="max-w-2xl p-6 rounded-xl border border-border bg-surface">
            <CoherencePanel
              reports={project.coherenceReports}
              onCheck={checkCoherence}
              loading={coherenceLoading}
            />
          </div>
        )}

        {tab === "settings" && (
          <div className="max-w-lg p-6 rounded-xl border border-border bg-surface">
            <h3 className="font-medium mb-4">Configuration IA</h3>
            <p className="text-sm text-muted mb-5">
              Choisissez votre fournisseur : Ollama en local, ou une clé API cloud.
              Les clés sont stockées localement dans votre projet.
            </p>
            <AISettings config={project.aiConfig} onSave={saveAIConfig} />
          </div>
        )}
      </main>
    </>
  );
}
