import { ErrorKey } from "@/lib/i18n";

export function resolveApiError(
  data: { errorKey?: string; error?: string },
  te: (key: ErrorKey, values?: Record<string, string | number>) => string
): string {
  if (data.errorKey) {
    return te(data.errorKey as ErrorKey);
  }
  return data.error ?? te("unknown");
}
