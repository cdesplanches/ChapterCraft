"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { SettingsIcon } from "@/components/SettingsIcon";
import { AISettings } from "@/components/AISettings";
import { AIProviderConfig } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";

export default function SettingsPage() {
  const { t } = useLocale();
  const [config, setConfig] = useState<AIProviderConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setConfig(data.aiConfig);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(aiConfig: AIProviderConfig) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiConfig }),
    });
    if (res.ok) {
      const data = await res.json();
      setConfig(data.aiConfig);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/" className="text-sm text-muted hover:text-accent">
          {t("settings.backHome")}
        </Link>
        <div className="flex items-center gap-3 mt-2 mb-1">
          <SettingsIcon className="w-7 h-7 text-accent" />
          <h2 className="text-2xl font-semibold">{t("settings.title")}</h2>
        </div>
        <p className="text-muted mb-8">{t("settings.description")}</p>

        {loading || !config ? (
          <p className="text-muted">{t("common.loading")}</p>
        ) : (
          <div className="p-6 rounded-xl border border-border bg-surface">
            <h3 className="font-medium mb-1">{t("settings.aiSection")}</h3>
            <p className="text-sm text-muted mb-6">{t("settings.aiSectionHint")}</p>
            <AISettings config={config} onSave={handleSave} />
            {saved && (
              <p className="text-sm text-green-700 mt-4">{t("settings.saved")}</p>
            )}
          </div>
        )}
      </main>
    </>
  );
}
