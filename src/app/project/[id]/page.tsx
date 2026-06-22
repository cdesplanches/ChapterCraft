"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/FormFields";
import { ChapterEditor } from "@/components/ChapterEditor";
import { BookOverviewPanel } from "@/components/BookOverviewPanel";
import { CoherencePanel } from "@/components/CoherencePanel";
import { BookProject, ChapterStatus } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";

type Tab = "chapters" | "pitch" | "overview";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale } = useLocale();
  const [project, setProject] = useState<BookProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("chapters");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [coherenceLoading, setCoherenceLoading] = useState(false);
  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingProject, setDeletingProject] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    if (!confirm(t("project.deleteChapterConfirm"))) return;
    await fetch(`/api/projects/${id}/chapters/${chapterId}`, { method: "DELETE" });
    if (selectedChapterId === chapterId) setSelectedChapterId(null);
    await load();
  }

  async function deleteProject() {
    if (deleteConfirmation !== "delete") return;
    setDeletingProject(true);
    setDeleteError(null);
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      return;
    }
    setDeleteError(t("project.deleteProjectError"));
    setDeletingProject(false);
  }

  function closeDeleteDialog() {
    if (deletingProject) return;
    setDeleteDialogOpen(false);
    setDeleteConfirmation("");
    setDeleteError(null);
  }

  async function checkCoherence() {
    setCoherenceLoading(true);
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check-coherence", projectId: id, locale }),
    });
    if (res.ok) await load();
    setCoherenceLoading(false);
  }

  if (loading || !project) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-muted">{t("common.loading")}</p>
        </main>
      </>
    );
  }

  const selectedChapter = project.chapters.find((c) => c.id === selectedChapterId);

  const tabs: { key: Tab; label: string }[] = [
    { key: "chapters", label: t("project.tabs.chapters") },
    { key: "pitch", label: t("project.tabs.pitch") },
    { key: "overview", label: t("project.tabs.overview") },
  ];

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href="/" className="text-sm text-muted hover:text-accent">
              {t("project.backToProjects")}
            </Link>
            <h2 className="text-2xl font-semibold mt-2 break-words">
              {project.title}
            </h2>
            <p className="text-sm text-muted mt-1 line-clamp-1">{project.pitch}</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            className="shrink-0 mt-7"
            onClick={() => setDeleteDialogOpen(true)}
          >
            {t("project.deleteProject")}
          </Button>
        </div>

        <nav className="flex gap-1 border-b border-border mb-6">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === tabItem.key
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {tabItem.label}
            </button>
          ))}
        </nav>

        {tab === "chapters" && (
          <div className="grid grid-cols-12 gap-6">
            <aside className="col-span-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder={t("project.newChapterPlaceholder")}
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
                        {t(`chapterStatus.${ch.status as ChapterStatus}`)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {project.chapters.length === 0 && (
                <p className="text-sm text-muted">{t("project.addFirstChapter")}</p>
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
                  {t("project.selectChapter")}
                </p>
              )}
            </section>
          </div>
        )}

        {tab === "pitch" && (
          <div className="max-w-2xl space-y-5 p-6 rounded-xl border border-border bg-surface">
            <Input
              label={t("project.fields.title")}
              defaultValue={project.title}
              onBlur={(e) =>
                e.target.value !== project.title &&
                updateProject({ title: e.target.value })
              }
            />
            <Textarea
              label={t("project.fields.pitch")}
              defaultValue={project.pitch}
              rows={4}
              onBlur={(e) =>
                e.target.value !== project.pitch &&
                updateProject({ pitch: e.target.value })
              }
            />
            <Textarea
              label={t("project.fields.synopsis")}
              defaultValue={project.synopsis}
              rows={8}
              onBlur={(e) =>
                e.target.value !== project.synopsis &&
                updateProject({ synopsis: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t("project.fields.genre")}
                defaultValue={project.genre}
                onBlur={(e) =>
                  e.target.value !== project.genre &&
                  updateProject({ genre: e.target.value })
                }
              />
              <Input
                label={t("project.fields.targetAudience")}
                defaultValue={project.targetAudience}
                onBlur={(e) =>
                  e.target.value !== project.targetAudience &&
                  updateProject({ targetAudience: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {tab === "overview" && (
          <div className="max-w-4xl space-y-8">
            <div className="p-6 rounded-xl border border-border bg-surface">
              <BookOverviewPanel project={project} />
            </div>
            <div className="p-6 rounded-xl border border-border bg-surface">
              <CoherencePanel
                reports={project.coherenceReports}
                onCheck={checkCoherence}
                loading={coherenceLoading}
              />
            </div>
          </div>
        )}
      </main>

      {deleteDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-project-title"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl">
            <h3 id="delete-project-title" className="text-lg font-semibold">
              {t("project.deleteProjectTitle")}
            </h3>
            <p className="mt-2 text-sm text-muted">
              {t("project.deleteProjectDescription")}
            </p>
            <p className="mt-4 text-sm font-medium">
              {t("project.deleteProjectInstruction")}
            </p>
            <div className="mt-3">
              <Input
                label={t("project.deleteProjectInputLabel")}
                placeholder={t("project.deleteProjectInputPlaceholder")}
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                autoFocus
              />
            </div>
            {deleteError && (
              <p className="mt-3 text-sm text-red-700">{deleteError}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={closeDeleteDialog}
                disabled={deletingProject}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={deleteProject}
                disabled={deleteConfirmation !== "delete"}
                loading={deletingProject}
              >
                {t("common.delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
