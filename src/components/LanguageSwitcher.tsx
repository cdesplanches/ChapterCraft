"use client";

import { LOCALE_LABELS, LOCALES, Locale } from "@/lib/i18n/types";
import { useLocale } from "@/contexts/LocaleContext";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="language-select" className="text-xs text-muted sr-only">
        {t("language.label")}
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="text-sm px-2.5 py-1.5 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent cursor-pointer"
        aria-label={t("language.label")}
      >
        {LOCALES.map((loc) => (
          <option key={loc} value={loc}>
            {loc.toUpperCase()} ({LOCALE_LABELS[loc]})
          </option>
        ))}
      </select>
    </div>
  );
}
