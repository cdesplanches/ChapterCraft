"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SettingsIcon } from "./SettingsIcon";
import { Button } from "./Button";
import { useLocale } from "@/contexts/LocaleContext";
import { usePathname } from "next/navigation";

interface HeaderUser {
  email: string;
  name: string;
}

interface HeaderProps {
  user?: HeaderUser | null;
  onLogout?: () => void;
}

export function Header({ user: userProp, onLogout }: HeaderProps = {}) {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const onSettings = pathname === "/settings";
  const [fetchedUser, setFetchedUser] = useState<HeaderUser | null>(null);

  const user = userProp !== undefined ? userProp : fetchedUser;

  useEffect(() => {
    if (userProp !== undefined) return;

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const parsed = data as { user?: HeaderUser } | null;
        setFetchedUser(parsed?.user ?? null);
      })
      .catch(() => setFetchedUser(null));
  }, [userProp]);

  async function handleLogout() {
    if (onLogout) {
      onLogout();
      return;
    }
    await fetch("/api/auth/logout", { method: "POST" });
    setFetchedUser(null);
    router.push("/");
  }

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-2xl" aria-hidden>
            ✒️
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight group-hover:text-accent transition-colors">
              ChapterCraft
            </h1>
            <p className="text-xs text-muted">{t("header.tagline")}</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-sm text-muted hidden sm:inline">
                {user.name || user.email}
              </span>
              <Link
                href="/settings"
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  onSettings
                    ? "text-accent font-medium"
                    : "text-muted hover:text-accent"
                }`}
                aria-current={onSettings ? "page" : undefined}
              >
                <SettingsIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{t("header.settings")}</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                {t("auth.logout")}
              </Button>
            </>
          )}
          <a
            href="https://paypal.me/kcdesplanches"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors"
            title={t("header.donate")}
          >
            <span className="text-lg" aria-hidden>
              ❤️
            </span>
            <span className="hidden sm:inline">{t("header.donate")}</span>
          </a>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
