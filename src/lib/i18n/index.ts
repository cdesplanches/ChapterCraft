import { en } from "./messages/en";
import { fr } from "./messages/fr";
import { es } from "./messages/es";
import {
  DEFAULT_LOCALE,
  LOCALE_DATE_FORMAT,
  LOCALE_LABELS,
  LOCALES,
  LOCALE_STORAGE_KEY,
  Locale,
  Messages,
  ErrorKey,
} from "./types";

const messages: Record<Locale, Messages> = { en, fr, es };

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? messages[DEFAULT_LOCALE];
}

export function getDateLocale(locale: Locale): string {
  return LOCALE_DATE_FORMAT[locale] ?? LOCALE_DATE_FORMAT.en;
}

type InterpolationValues = Record<string, string | number>;

function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

export function translate(
  locale: Locale,
  key: string,
  values?: InterpolationValues
): string {
  const template =
    getNestedValue(getMessages(locale), key) ??
    getNestedValue(getMessages(DEFAULT_LOCALE), key) ??
    key;

  if (!values) return template;

  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    values[name] != null ? String(values[name]) : `{${name}}`
  );
}


export function translateError(
  locale: Locale,
  errorKey: ErrorKey,
  values?: InterpolationValues
): string {
  return translate(locale, `errors.${errorKey}`, values);
}

export {
  DEFAULT_LOCALE,
  LOCALE_DATE_FORMAT,
  LOCALE_LABELS,
  LOCALES,
  LOCALE_STORAGE_KEY,
};
export type { Locale, Messages, ErrorKey } from "./types";
