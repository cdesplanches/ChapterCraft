"use client";

import { LocaleProvider } from "@/contexts/LocaleContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}
