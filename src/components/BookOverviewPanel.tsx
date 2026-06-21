"use client";

import { BookProject, ChapterStatus } from "@/lib/types";
import {
  computeBookStats,
  formatNumber,
  formatPages,
  WORDS_PER_PAGE,
} from "@/lib/book-stats";
import { useLocale } from "@/contexts/LocaleContext";

interface BookOverviewPanelProps {
  project: BookProject;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-surface">
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold mt-1 tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}

export function BookOverviewPanel({ project }: BookOverviewPanelProps) {
  const { t, dateLocale } = useLocale();
  const stats = computeBookStats(project);

  const statuses: ChapterStatus[] = ["outline", "draft", "revision", "done"];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-medium">{t("overview.title")}</h3>
        <p className="text-sm text-muted mt-1">{t("overview.description")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label={t("overview.totalWords")}
          value={formatNumber(stats.totalContentWords, dateLocale)}
        />
        <StatCard
          label={t("overview.estimatedPages")}
          value={formatPages(stats.estimatedPages, dateLocale)}
          hint={t("overview.pagesHint", { count: WORDS_PER_PAGE })}
        />
        <StatCard
          label={t("overview.chapters")}
          value={formatNumber(stats.chapterCount, dateLocale)}
        />
        <StatCard
          label={t("overview.readingTime")}
          value={t("overview.readingMinutes", { count: stats.readingMinutes })}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label={t("overview.characters")}
          value={formatNumber(stats.totalCharacters, dateLocale)}
        />
        <StatCard
          label={t("overview.outlineWords")}
          value={formatNumber(stats.totalOutlineWords, dateLocale)}
        />
      </div>

      {stats.chapterCount > 0 && (
        <div className="flex flex-wrap gap-3">
          {statuses.map((status) => (
            <span
              key={status}
              className="text-sm px-3 py-1.5 rounded-full border border-border bg-surface"
            >
              {t(`chapterStatus.${status}`)}:{" "}
              <span className="font-medium">{stats.statusCounts[status]}</span>
            </span>
          ))}
        </div>
      )}

      {stats.chapters.length > 0 ? (
        <div>
          <h4 className="font-medium text-sm mb-3">{t("overview.byChapter")}</h4>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-hover/50 text-left">
                  <th className="px-4 py-3 font-medium text-muted">#</th>
                  <th className="px-4 py-3 font-medium text-muted">{t("chapter.title")}</th>
                  <th className="px-4 py-3 font-medium text-muted">{t("chapter.status")}</th>
                  <th className="px-4 py-3 font-medium text-muted text-right">
                    {t("overview.words")}
                  </th>
                  <th className="px-4 py-3 font-medium text-muted text-right">
                    {t("overview.pages")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.chapters.map((ch) => (
                  <tr key={ch.chapterId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-muted">{ch.number}</td>
                    <td className="px-4 py-3">{ch.title}</td>
                    <td className="px-4 py-3 text-muted">
                      {t(`chapterStatus.${ch.status}`)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(ch.contentWords, dateLocale)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {ch.contentWords === 0
                        ? "—"
                        : formatPages(ch.estimatedPages, dateLocale)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-accent-light/30 font-medium">
                  <td className="px-4 py-3" colSpan={3}>
                    {t("overview.total")}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatNumber(stats.totalContentWords, dateLocale)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {stats.totalContentWords === 0
                      ? "—"
                      : formatPages(stats.estimatedPages, dateLocale)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">{t("overview.noChapters")}</p>
      )}
    </div>
  );
}
