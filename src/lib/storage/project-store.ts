import {
  BookProject,
  Chapter,
  CoherenceReport,
} from "../types";
import { getStorageBackend, userKey } from "./context";
import { FsStorageBackend } from "./fs-backend";

/** D1 row limit is ~2 MB; warn early, reject before SQLite fails. */
export const D1_ROW_SOFT_LIMIT_BYTES = 1_500_000;
export const D1_ROW_HARD_LIMIT_BYTES = 2_000_000;

export class DocumentTooLargeError extends Error {
  constructor(
    public readonly label: string,
    public readonly bytes: number
  ) {
    super("DOCUMENT_TOO_LARGE");
    this.name = "DocumentTooLargeError";
  }
}

export function documentByteSize(body: string): number {
  return new TextEncoder().encode(body).length;
}

export function assertDocumentSize(body: string, label: string): void {
  const bytes = documentByteSize(body);
  if (bytes > D1_ROW_HARD_LIMIT_BYTES) {
    throw new DocumentTooLargeError(label, bytes);
  }
}

function legacyProjectKey(userId: string, projectId: string) {
  return userKey(userId, "projects", `${projectId}.json`);
}

function metaKey(userId: string, projectId: string) {
  return userKey(userId, "projects", projectId, "meta.json");
}

function chapterKey(userId: string, projectId: string, chapterId: string) {
  return userKey(userId, "projects", projectId, "chapters", `${chapterId}.json`);
}

function projectPrefix(userId: string, projectId: string) {
  return userKey(userId, "projects", projectId);
}

export type ChapterIndexEntry = Pick<
  Chapter,
  "id" | "number" | "title" | "status" | "updatedAt"
>;

export type ProjectSummary = Omit<
  Pick<BookProject, "id" | "title" | "pitch" | "updatedAt" | "chapters">,
  "chapters"
> & {
  chapters: Pick<ChapterIndexEntry, "id" | "number" | "title" | "status">[];
};

export interface ProjectManifest {
  id: string;
  title: string;
  pitch: string;
  synopsis: string;
  genre: string;
  targetAudience: string;
  chapters: ChapterIndexEntry[];
  coherenceReports: CoherenceReport[];
  aiConfig: BookProject["aiConfig"];
  createdAt: string;
  updatedAt: string;
}

function manifestFromProject(project: BookProject): ProjectManifest {
  return {
    id: project.id,
    title: project.title,
    pitch: project.pitch,
    synopsis: project.synopsis,
    genre: project.genre,
    targetAudience: project.targetAudience,
    chapters: project.chapters.map(({ id, number, title, status, updatedAt }) => ({
      id,
      number,
      title,
      status,
      updatedAt,
    })),
    coherenceReports: project.coherenceReports,
    aiConfig: project.aiConfig,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

async function readLegacyProject(
  userId: string,
  projectId: string
): Promise<BookProject | null> {
  const backend = await getStorageBackend();
  const key = legacyProjectKey(userId, projectId);
  let raw = await backend.read(key);
  if (!raw && backend instanceof FsStorageBackend) {
    raw = await backend.read(`projects/${projectId}.json`);
  }
  if (!raw) return null;
  return JSON.parse(raw) as BookProject;
}

async function readChapter(
  userId: string,
  projectId: string,
  chapterId: string
): Promise<Chapter | null> {
  const backend = await getStorageBackend();
  const raw = await backend.read(chapterKey(userId, projectId, chapterId));
  if (!raw) return null;
  return JSON.parse(raw) as Chapter;
}

async function writeJson(key: string, value: unknown, label: string) {
  const body = JSON.stringify(value, null, 2);
  assertDocumentSize(body, label);
  const backend = await getStorageBackend();
  await backend.write(key, body);
}

export async function loadProject(
  userId: string,
  projectId: string
): Promise<BookProject | null> {
  const backend = await getStorageBackend();
  const metaRaw = await backend.read(metaKey(userId, projectId));

  if (!metaRaw) {
    return readLegacyProject(userId, projectId);
  }

  const manifest = JSON.parse(metaRaw) as ProjectManifest;
  const chapters = await Promise.all(
    manifest.chapters.map((entry) => readChapter(userId, projectId, entry.id))
  );

  const loaded = chapters.filter((c): c is Chapter => c !== null);
  if (loaded.length !== manifest.chapters.length) {
    return null;
  }

  loaded.sort((a, b) => a.number - b.number);

  return {
    ...manifest,
    chapters: loaded,
  };
}

/** Persist project using one D1 row per chapter (avoids 2 MB whole-book limit). */
export async function saveProject(userId: string, project: BookProject) {
  const manifest = manifestFromProject(project);
  await writeJson(
    metaKey(userId, project.id),
    manifest,
    `project ${project.id} meta`
  );

  for (const chapter of project.chapters) {
    await writeJson(
      chapterKey(userId, project.id, chapter.id),
      chapter,
      `project ${project.id} chapter ${chapter.number}`
    );
  }

  const backend = await getStorageBackend();
  await backend.delete(legacyProjectKey(userId, project.id));
  if (backend instanceof FsStorageBackend) {
    await backend.delete(`projects/${project.id}.json`);
  }
}

export async function saveChapter(
  userId: string,
  projectId: string,
  chapter: Chapter,
  manifest: ProjectManifest
) {
  await writeJson(
    chapterKey(userId, projectId, chapter.id),
    chapter,
    `project ${projectId} chapter ${chapter.number}`
  );
  manifest.updatedAt = new Date().toISOString();
  const idx = manifest.chapters.findIndex((c) => c.id === chapter.id);
  const entry: ChapterIndexEntry = {
    id: chapter.id,
    number: chapter.number,
    title: chapter.title,
    status: chapter.status,
    updatedAt: chapter.updatedAt,
  };
  if (idx === -1) {
    manifest.chapters.push(entry);
  } else {
    manifest.chapters[idx] = entry;
  }
  manifest.chapters.sort((a, b) => a.number - b.number);
  await writeJson(
    metaKey(userId, projectId),
    manifest,
    `project ${projectId} meta`
  );
}

export async function loadManifest(
  userId: string,
  projectId: string
): Promise<ProjectManifest | null> {
  const backend = await getStorageBackend();
  const metaRaw = await backend.read(metaKey(userId, projectId));
  if (metaRaw) {
    return JSON.parse(metaRaw) as ProjectManifest;
  }

  const legacy = await readLegacyProject(userId, projectId);
  return legacy ? manifestFromProject(legacy) : null;
}

export async function listProjectSummaries(
  userId: string
): Promise<ProjectSummary[]> {
  const backend = await getStorageBackend();
  const prefix = userKey(userId, "projects");
  let keys = await backend.list(prefix);

  if (keys.length === 0 && backend instanceof FsStorageBackend) {
    keys = await backend.list("projects");
  }

  const projectIds = new Set<string>();

  for (const key of keys) {
    if (key.endsWith("/meta.json")) {
      const parts = key.split("/");
      projectIds.add(parts[parts.length - 2] ?? "");
    } else if (key.endsWith(".json") && !key.includes("/chapters/")) {
      projectIds.add(key.split("/").pop()?.replace(".json", "") ?? "");
    } else if (!key.includes(".") && key.startsWith(prefix)) {
      projectIds.add(key.split("/").pop() ?? "");
    }
  }

  const summaries = await Promise.all(
    [...projectIds]
      .filter(Boolean)
      .map(async (id) => {
        const manifest = await loadManifest(userId, id);
        if (!manifest) return null;

        return {
          id: manifest.id,
          title: manifest.title,
          pitch: manifest.pitch,
          updatedAt: manifest.updatedAt,
          chapters: manifest.chapters.map(({ id: cid, number, title, status }) => ({
            id: cid,
            number,
            title,
            status,
          })),
        };
      })
  );

  return summaries
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export async function deleteProjectFiles(
  userId: string,
  projectId: string
): Promise<boolean> {
  const backend = await getStorageBackend();
  let deleted = false;

  if (backend instanceof FsStorageBackend) {
    if (await backend.deleteTree(projectPrefix(userId, projectId))) {
      deleted = true;
    }
  } else {
    const prefix = projectPrefix(userId, projectId);
    const keys = await backend.list(prefix);
    for (const key of keys) {
      if (await backend.delete(key)) deleted = true;
    }
  }

  if (await backend.delete(legacyProjectKey(userId, projectId))) {
    deleted = true;
  }
  if (backend instanceof FsStorageBackend) {
    if (await backend.delete(`projects/${projectId}.json`)) {
      deleted = true;
    }
  }

  return deleted;
}

export async function deleteChapterFile(
  userId: string,
  projectId: string,
  chapterId: string
) {
  const backend = await getStorageBackend();
  await backend.delete(chapterKey(userId, projectId, chapterId));
}
