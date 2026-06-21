"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./Button";
import { Input, Textarea } from "./FormFields";
import { useLocale } from "@/contexts/LocaleContext";
import { resolveApiError } from "@/lib/api-error";

export function NewProjectForm({
  onClose,
  onCreated,
}: {
  onClose?: () => void;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const { t, te } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        pitch: form.get("pitch"),
        synopsis: form.get("synopsis"),
        genre: form.get("genre"),
        targetAudience: form.get("targetAudience"),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(resolveApiError(data, te) || te("createFailed"));
      setLoading(false);
      return;
    }

    const project = (await res.json()) as { id: string };
    if (onCreated) {
      onCreated();
      router.push(`/project/${project.id}`);
    } else {
      router.push(`/project/${project.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        name="title"
        label={t("newProject.bookTitle")}
        required
        placeholder={t("newProject.bookTitlePlaceholder")}
      />
      <Textarea
        name="pitch"
        label={t("project.fields.pitch")}
        required
        rows={4}
        placeholder={t("newProject.pitchPlaceholder")}
      />
      <Textarea
        name="synopsis"
        label={t("newProject.synopsisOptional")}
        rows={5}
        placeholder={t("newProject.synopsisPlaceholder")}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          name="genre"
          label={t("project.fields.genre")}
          placeholder={t("newProject.genrePlaceholder")}
        />
        <Input
          name="targetAudience"
          label={t("project.fields.targetAudience")}
          placeholder={t("newProject.audiencePlaceholder")}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 justify-end pt-2">
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {t("newProject.create")}
        </Button>
      </div>
    </form>
  );
}
