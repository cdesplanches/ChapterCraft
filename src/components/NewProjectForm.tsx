"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./Button";
import { Input, Textarea } from "./FormFields";

export function NewProjectForm({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
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
      setError(data.error ?? "Erreur lors de la création");
      setLoading(false);
      return;
    }

    const project = await res.json();
    router.push(`/project/${project.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input name="title" label="Titre du livre" required placeholder="Mon roman" />
      <Textarea
        name="pitch"
        label="Pitch"
        required
        rows={4}
        placeholder="En une ou deux phrases, de quoi parle votre livre ?"
      />
      <Textarea
        name="synopsis"
        label="Synopsis (optionnel)"
        rows={5}
        placeholder="Résumé plus détaillé de l'intrigue, des personnages principaux..."
      />
      <div className="grid grid-cols-2 gap-4">
        <Input name="genre" label="Genre" placeholder="Thriller, fantasy..." />
        <Input
          name="targetAudience"
          label="Public cible"
          placeholder="Adultes, YA..."
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 justify-end pt-2">
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
        )}
        <Button type="submit" loading={loading}>
          Créer le projet
        </Button>
      </div>
    </form>
  );
}
