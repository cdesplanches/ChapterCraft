"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { NewProjectForm } from "@/components/NewProjectForm";
interface ProjectSummary {
  id: string;
  title: string;
  pitch: string;
  updatedAt: string;
  chapters: { id: string; status: string }[];
}

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Mes projets</h2>
            <p className="text-muted mt-1">
              Créez un livre à partir de votre pitch et travaillez chapitre par chapitre.
            </p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>Nouveau projet</Button>
          )}
        </div>

        {showForm && (
          <div className="mb-10 p-6 rounded-xl border border-border bg-surface shadow-sm">
            <h3 className="font-medium mb-4">Nouveau livre</h3>
            <NewProjectForm onClose={() => setShowForm(false)} />
          </div>
        )}

        {loading ? (
          <p className="text-muted">Chargement…</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <p className="text-4xl mb-4" aria-hidden>
              📖
            </p>
            <p className="text-muted mb-4">Aucun projet pour l&apos;instant.</p>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>Commencer</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((p) => {
              const done = p.chapters.filter((c) => c.status === "done").length;
              return (
                <Link
                  key={p.id}
                  href={`/project/${p.id}`}
                  className="block p-5 rounded-xl border border-border bg-surface hover:border-accent/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-lg">{p.title}</h3>
                      <p className="text-sm text-muted mt-1 line-clamp-2">{p.pitch}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">
                        {p.chapters.length} chapitre{p.chapters.length !== 1 ? "s" : ""}
                      </p>
                      {p.chapters.length > 0 && (
                        <p className="text-xs text-muted mt-1">
                          {done} terminé{done !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted mt-3">
                    Modifié le {new Date(p.updatedAt).toLocaleDateString("fr-FR")}
                  </p>
                </Link>
              );
            })}
          </div>
        )}

        <section className="mt-16 p-6 rounded-xl bg-accent-light/30 border border-accent/10">
          <h3 className="font-medium mb-2">Comment ça marche</h3>
          <ol className="text-sm text-muted space-y-2 list-decimal list-inside">
            <li>Définissez votre pitch et la structure globale de votre livre</li>
            <li>Ajoutez et travaillez chaque chapitre individuellement</li>
            <li>L&apos;IA vérifie la cohérence narrative avec l&apos;ensemble du projet</li>
            <li>Connectez Ollama en local ou vos clés API OpenAI / Anthropic</li>
          </ol>
        </section>
      </main>
    </>
  );
}
