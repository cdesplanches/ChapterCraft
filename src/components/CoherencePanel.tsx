"use client";

import { CoherenceReport } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";

interface CoherencePanelProps {
  reports: CoherenceReport[];
  onCheck: () => Promise<void>;
  loading: boolean;
}

function severityColor(severity: string) {
  switch (severity) {
    case "high":
      return "text-red-700 bg-red-50 border-red-200";
    case "medium":
      return "text-amber-700 bg-amber-50 border-amber-200";
    default:
      return "text-stone-600 bg-stone-50 border-stone-200";
  }
}

export function CoherencePanel({ reports, onCheck, loading }: CoherencePanelProps) {
  const { t, dateLocale } = useLocale();
  const latest = reports[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{t("coherence.title")}</h3>
        <button
          onClick={onCheck}
          disabled={loading}
          className="text-sm text-accent hover:underline disabled:opacity-50"
        >
          {loading ? t("coherence.analyzing") : t("coherence.analyze")}
        </button>
      </div>

      {!latest ? (
        <p className="text-sm text-muted">{t("coherence.emptyDescription")}</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-4 ${
                latest.score >= 80
                  ? "border-green-400 text-green-700"
                  : latest.score >= 60
                    ? "border-amber-400 text-amber-700"
                    : "border-red-400 text-red-700"
              }`}
            >
              {latest.score}
            </div>
            <div>
              <p className="text-sm font-medium">{t("coherence.score")}</p>
              <p className="text-sm text-muted mt-1">{latest.summary}</p>
            </div>
          </div>

          {latest.issues.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("coherence.issues")}</p>
              {latest.issues.map((issue, i) => (
                <div
                  key={i}
                  className={`text-sm p-3 rounded-lg border ${severityColor(issue.severity)}`}
                >
                  {issue.chapterTitle && (
                    <span className="font-medium">{issue.chapterTitle} — </span>
                  )}
                  {issue.description}
                </div>
              ))}
            </div>
          )}

          {latest.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("coherence.suggestions")}</p>
              <ul className="text-sm text-muted space-y-1 list-disc list-inside">
                {latest.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-muted">
            {t("coherence.lastAnalysis", {
              date: new Date(latest.createdAt).toLocaleString(dateLocale),
            })}
          </p>
        </div>
      )}
    </div>
  );
}
