"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./Button";
import { Input } from "./FormFields";
import { useLocale } from "@/contexts/LocaleContext";
import { resolveApiError } from "@/lib/api-error";

interface AuthPanelProps {
  onSuccess: () => void;
  initialTab?: "login" | "signup";
}

export function AuthPanel({ onSuccess, initialTab = "login" }: AuthPanelProps) {
  const { t, te } = useLocale();
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const email = form.get("email");
    const password = form.get("password");
    const name = form.get("name");

    const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body =
      tab === "login"
        ? { email, password }
        : { email, password, name: name || "" };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as { errorKey?: string; error?: string };

    if (!res.ok) {
      setError(resolveApiError(data, te));
      setLoading(false);
      return;
    }

    onSuccess();
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex border-b border-border mb-6">
        {(["login", "signup"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setError("");
            }}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t(`auth.${key}`)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-xl border border-border bg-surface">
        {tab === "signup" && (
          <Input
            name="name"
            label={t("auth.name")}
            placeholder={t("auth.namePlaceholder")}
            autoComplete="name"
          />
        )}
        <Input
          name="email"
          type="email"
          label={t("auth.email")}
          required
          placeholder={t("auth.emailPlaceholder")}
          autoComplete="email"
        />
        <Input
          name="password"
          type="password"
          label={t("auth.password")}
          required
          placeholder={t("auth.passwordPlaceholder")}
          autoComplete={tab === "login" ? "current-password" : "new-password"}
          minLength={8}
        />
        {tab === "signup" && (
          <p className="text-xs text-muted">{t("auth.passwordHint")}</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          {tab === "login" ? t("auth.loginButton") : t("auth.signupButton")}
        </Button>
      </form>
    </div>
  );
}
