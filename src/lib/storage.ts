import { v4 as uuidv4 } from "uuid";
import {
  BookProject,
  Chapter,
  CoherenceReport,
} from "./types";
import { getStorageUserId } from "./storage/context";
import { getGlobalAiConfig } from "./settings-storage";
import {
  deleteChapterFile,
  deleteProjectFiles,
  loadManifest,
  loadProject,
  listProjectSummaries,
  saveChapter,
  saveProject,
} from "./storage/project-store";

export async function listProjects(): Promise<
  Pick<BookProject, "id" | "title" | "pitch" | "updatedAt" | "chapters">[]
> {
  const userId = await getStorageUserId();
  return listProjectSummaries(userId);
}

export async function getProject(id: string): Promise<BookProject | null> {
  const userId = await getStorageUserId();
  return loadProject(userId, id);
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
  await saveProject(userId, project);
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
  const project = await loadProject(userId, id);
  if (!project) return null;

  const updated: BookProject = {
    ...project,
    ...updates,
    aiConfig: updates.aiConfig
      ? { ...project.aiConfig, ...updates.aiConfig }
      : project.aiConfig,
    updatedAt: new Date().toISOString(),
  };
  await saveProject(userId, updated);
  return updated;
}

export async function deleteProject(id: string): Promise<boolean> {
  const userId = await getStorageUserId();
  return deleteProjectFiles(userId, id);
}

export async function addChapter(
  projectId: string,
  data: Pick<Chapter, "title" | "outline">
): Promise<Chapter | null> {
  const userId = await getStorageUserId();
  const manifest = await loadManifest(userId, projectId);
  if (!manifest) return null;

  const now = new Date().toISOString();
  const chapter: Chapter = {
    id: uuidv4(),
    number: manifest.chapters.length + 1,
    title: data.title,
    outline: data.outline,
    content: "",
    status: "outline",
    notes: "",
    updatedAt: now,
  };

  await saveChapter(userId, projectId, chapter, manifest);
  return chapter;
}

export async function updateChapter(
  projectId: string,
  chapterId: string,
  updates: Partial<Omit<Chapter, "id" | "number">>
): Promise<Chapter | null> {
  const userId = await getStorageUserId();
  const project = await loadProject(userId, projectId);
  if (!project) return null;

  const idx = project.chapters.findIndex((c) => c.id === chapterId);
  if (idx === -1) return null;

  const chapter: Chapter = {
    ...project.chapters[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const manifest = (await loadManifest(userId, projectId))!;
  await saveChapter(userId, projectId, chapter, manifest);
  return chapter;
}

export async function deleteChapter(
  projectId: string,
  chapterId: string
): Promise<boolean> {
  const userId = await getStorageUserId();
  const project = await loadProject(userId, projectId);
  if (!project) return false;

  project.chapters = project.chapters
    .filter((c) => c.id !== chapterId)
    .map((c, i) => ({ ...c, number: i + 1 }));
  project.updatedAt = new Date().toISOString();

  await deleteChapterFile(userId, projectId, chapterId);
  await saveProject(userId, project);
  return true;
}

export async function addCoherenceReport(
  projectId: string,
  report: Omit<CoherenceReport, "id" | "createdAt">
): Promise<CoherenceReport | null> {
  const userId = await getStorageUserId();
  const project = await loadProject(userId, projectId);
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
  await saveProject(userId, project);
  return full;
}

export { DocumentTooLargeError } from "./storage/project-store";
