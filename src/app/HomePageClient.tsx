"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { AuthPanel } from "@/components/AuthPanel";
import { NewProjectForm } from "@/components/NewProjectForm";
import { useLocale } from "@/contexts/LocaleContext";

interface User {
  id: string;
  email: string;
  name: string;
}

interface ProjectSummary {
  id: string;
  title: string;
  pitch: string;
  updatedAt: string;
  chapters: { id: string; status: string }[];
}

export default function HomePageClient() {
  const { t, dateLocale } = useLocale();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadUser = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = (await res.json()) as { user: User };
      setUser(data.user);
      return data.user;
    }
    setUser(null);
    return null;
  }, []);

  const loadProjects = useCallback(async () => {
    const res = await fetch("/api/projects");
    if (res.ok) {
      const data = (await res.json()) as ProjectSummary[];
      setProjects(data);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const u = await loadUser();
    if (u) await loadProjects();
    setLoading(false);
  }, [loadUser, loadProjects]);

  useEffect(() => {
    load();
  }, [load]);

  const authRequired = searchParams.get("auth") === "required";

  async function handleAuthSuccess() {
    await load();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setProjects([]);
  }

  if (loading) {
    return (
      <>
        <Header user={null} onLogout={handleLogout} />
        <main className="max-w-5xl mx-auto px-6 py-10">
          <p className="text-muted">{t("common.loading")}</p>
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header user={null} onLogout={handleLogout} />
        <main className="max-w-5xl mx-auto px-6 py-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold tracking-tight">ChapterCraft</h2>
            <p className="text-muted mt-2 max-w-lg mx-auto">{t("auth.welcome")}</p>
            {authRequired && (
              <p className="text-sm text-amber-700 mt-3">{t("auth.loginRequired")}</p>
            )}
          </div>
          <AuthPanel onSuccess={handleAuthSuccess} />
          <section className="mt-16 max-w-lg mx-auto p-6 rounded-xl bg-accent-light/30 border border-accent/10">
            <h3 className="font-medium mb-2">{t("home.howItWorks")}</h3>
            <ol className="text-sm text-muted space-y-2 list-decimal list-inside">
              <li>{t("home.step1")}</li>
              <li>{t("home.step2")}</li>
              <li>{t("home.step3")}</li>
              <li>{t("home.step4")}</li>
            </ol>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Header user={user} onLogout={handleLogout} />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {user.name ? t("auth.greeting", { name: user.name }) : t("home.title")}
            </h2>
            <p className="text-muted mt-1">{t("home.subtitle")}</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>{t("home.newProject")}</Button>
          )}
        </div>

        {showForm && (
          <div className="mb-10 p-6 rounded-xl border border-border bg-surface shadow-sm">
            <h3 className="font-medium mb-4">{t("home.newBook")}</h3>
            <NewProjectForm
              onClose={() => setShowForm(false)}
              onCreated={() => {
                loadProjects();
                setShowForm(false);
              }}
            />
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <p className="text-4xl mb-4" aria-hidden>
              📖
            </p>
            <p className="text-muted mb-4">{t("home.noProjects")}</p>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>{t("home.getStarted")}</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((p) => {
              const done = p.chapters.filter((c) => c.status === "done").length;
              const chapterLabel =
                p.chapters.length === 1 ? t("home.chapter") : t("home.chapters");
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
                        {p.chapters.length} {chapterLabel}
                      </p>
                      {p.chapters.length > 0 && (
                        <p className="text-xs text-muted mt-1">
                          {done} {t("home.done")}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted mt-3">
                    {t("home.modifiedOn", {
                      date: new Date(p.updatedAt).toLocaleDateString(dateLocale),
                    })}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
