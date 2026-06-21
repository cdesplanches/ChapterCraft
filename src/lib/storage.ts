import { v4 as uuidv4 } from "uuid";
import {
  BookProject,
  Chapter,
  CoherenceReport,
} from "./types";
import {
  getStorageBackend,
  getStorageUserId,
  userKey,
} from "./storage/context";
import { FsStorageBackend } from "./storage/fs-backend";
import { getGlobalAiConfig } from "./settings-storage";

async function projectsPrefix(userId: string) {
  return userKey(userId, "projects");
}

function projectKey(userId: string, id: string) {
  return userKey(userId, "projects", `${id}.json`);
}

/** Legacy local path before D1 / multi-user layout */
function legacyProjectKey(id: string) {
  return `projects/${id}.json`;
}

async function readProjectRaw(
  userId: string,
  id: string
): Promise<string | null> {
  const backend = await getStorageBackend();
  const key = projectKey(userId, id);
  let raw = await backend.read(key);
  if (!raw && backend instanceof FsStorageBackend) {
    raw = await backend.read(legacyProjectKey(id));
  }
  return raw;
}

export async function listProjects(): Promise<
  Pick<BookProject, "id" | "title" | "pitch" | "updatedAt" | "chapters">[]
> {
  const userId = await getStorageUserId();
  const backend = await getStorageBackend();
  const prefix = await projectsPrefix(userId);

  let keys = await backend.list(prefix);
  if (keys.length === 0 && backend instanceof FsStorageBackend) {
    keys = await backend.list("projects");
  }

  const projects = await Promise.all(
    keys
      .filter((k) => k.endsWith(".json"))
      .map(async (k) => {
        const id = k.split("/").pop()?.replace(".json", "") ?? "";
        const raw = await readProjectRaw(userId, id);
        if (!raw) return null;
        const project = JSON.parse(raw) as BookProject;
        return {
          id: project.id,
          title: project.title,
          pitch: project.pitch,
          updatedAt: project.updatedAt,
          chapters: project.chapters,
        };
      })
  );

  return projects
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export async function getProject(id: string): Promise<BookProject | null> {
  const userId = await getStorageUserId();
  const raw = await readProjectRaw(userId, id);
  if (!raw) return null;
  return JSON.parse(raw) as BookProject;
}

async function writeProject(userId: string, project: BookProject) {
  const backend = await getStorageBackend();
  await backend.write(
    projectKey(userId, project.id),
    JSON.stringify(project, null, 2)
  );
}

export async function createProject(
  data: Pick<BookProject, "title" | "pitch" | "synopsis" | "genre" | "targetAudience">
): Promise<BookProject> {
  const userId = await getStorageUserId();
  const globalAiConfig = await getGlobalAiConfig();
  const now = new Date().toISOString();
  const project: BookProject = {
    id: uuidv4(),
    title: data.title,
    pitch: data.pitch,
    synopsis: data.synopsis,
    genre: data.genre,
    targetAudience: data.targetAudience,
    chapters: [],
    coherenceReports: [],
    aiConfig: { ...globalAiConfig },
    createdAt: now,
    updatedAt: now,
  };
  await writeProject(userId, project);
  return project;
}

export async function updateProject(
  id: string,
  updates: Partial<
    Pick<
      BookProject,
      "title" | "pitch" | "synopsis" | "genre" | "targetAudience" | "aiConfig"
    >
  >
): Promise<BookProject | null> {
  const userId = await getStorageUserId();
  const project = await getProject(id);
  if (!project) return null;

  const updated: BookProject = {
    ...project,
    ...updates,
    aiConfig: updates.aiConfig
      ? { ...project.aiConfig, ...updates.aiConfig }
      : project.aiConfig,
    updatedAt: new Date().toISOString(),
  };
  await writeProject(userId, updated);
  return updated;
}

export async function deleteProject(id: string): Promise<boolean> {
  const userId = await getStorageUserId();
  const backend = await getStorageBackend();
  return backend.delete(projectKey(userId, id));
}

export async function addChapter(
  projectId: string,
  data: Pick<Chapter, "title" | "outline">
): Promise<Chapter | null> {
  const userId = await getStorageUserId();
  const project = await getProject(projectId);
  if (!project) return null;

  const now = new Date().toISOString();
  const chapter: Chapter = {
    id: uuidv4(),
    number: project.chapters.length + 1,
    title: data.title,
    outline: data.outline,
    content: "",
    status: "outline",
    notes: "",
    updatedAt: now,
  };

  project.chapters.push(chapter);
  project.updatedAt = now;
  await writeProject(userId, project);
  return chapter;
}

export async function updateChapter(
  projectId: string,
  chapterId: string,
  updates: Partial<Omit<Chapter, "id" | "number">>
): Promise<Chapter | null> {
  const userId = await getStorageUserId();
  const project = await getProject(projectId);
  if (!project) return null;

  const idx = project.chapters.findIndex((c) => c.id === chapterId);
  if (idx === -1) return null;

  project.chapters[idx] = {
    ...project.chapters[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  project.updatedAt = new Date().toISOString();
  await writeProject(userId, project);
  return project.chapters[idx];
}

export async function deleteChapter(
  projectId: string,
  chapterId: string
): Promise<boolean> {
  const userId = await getStorageUserId();
  const project = await getProject(projectId);
  if (!project) return false;

  project.chapters = project.chapters
    .filter((c) => c.id !== chapterId)
    .map((c, i) => ({ ...c, number: i + 1 }));
  project.updatedAt = new Date().toISOString();
  await writeProject(userId, project);
  return true;
}

export async function addCoherenceReport(
  projectId: string,
  report: Omit<CoherenceReport, "id" | "createdAt">
): Promise<CoherenceReport | null> {
  const userId = await getStorageUserId();
  const project = await getProject(projectId);
  if (!project) return null;

  const full: CoherenceReport = {
    ...report,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  project.coherenceReports.unshift(full);
  if (project.coherenceReports.length > 10) {
    project.coherenceReports = project.coherenceReports.slice(0, 10);
  }
  project.updatedAt = new Date().toISOString();
  await writeProject(userId, project);
  return full;
}
