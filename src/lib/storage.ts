import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  BookProject,
  Chapter,
  CoherenceReport,
  DEFAULT_AI_CONFIG,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_DIR = path.join(DATA_DIR, "projects");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function projectPath(id: string) {
  return path.join(PROJECTS_DIR, `${id}.json`);
}

export async function listProjects(): Promise<
  Pick<BookProject, "id" | "title" | "pitch" | "updatedAt" | "chapters">[]
> {
  await ensureDir(PROJECTS_DIR);
  const files = await fs.readdir(PROJECTS_DIR);
  const projects = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map(async (f) => {
        const raw = await fs.readFile(path.join(PROJECTS_DIR, f), "utf-8");
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
  return projects.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getProject(id: string): Promise<BookProject | null> {
  try {
    const raw = await fs.readFile(projectPath(id), "utf-8");
    return JSON.parse(raw) as BookProject;
  } catch {
    return null;
  }
}

export async function createProject(
  data: Pick<BookProject, "title" | "pitch" | "synopsis" | "genre" | "targetAudience">
): Promise<BookProject> {
  await ensureDir(PROJECTS_DIR);
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
    aiConfig: { ...DEFAULT_AI_CONFIG },
    createdAt: now,
    updatedAt: now,
  };
  await fs.writeFile(projectPath(project.id), JSON.stringify(project, null, 2));
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
  await fs.writeFile(projectPath(id), JSON.stringify(updated, null, 2));
  return updated;
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    await fs.unlink(projectPath(id));
    return true;
  } catch {
    return false;
  }
}

export async function addChapter(
  projectId: string,
  data: Pick<Chapter, "title" | "outline">
): Promise<Chapter | null> {
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
  await fs.writeFile(projectPath(projectId), JSON.stringify(project, null, 2));
  return chapter;
}

export async function updateChapter(
  projectId: string,
  chapterId: string,
  updates: Partial<Omit<Chapter, "id" | "number">>
): Promise<Chapter | null> {
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
  await fs.writeFile(projectPath(projectId), JSON.stringify(project, null, 2));
  return project.chapters[idx];
}

export async function deleteChapter(
  projectId: string,
  chapterId: string
): Promise<boolean> {
  const project = await getProject(projectId);
  if (!project) return false;

  project.chapters = project.chapters
    .filter((c) => c.id !== chapterId)
    .map((c, i) => ({ ...c, number: i + 1 }));
  project.updatedAt = new Date().toISOString();
  await fs.writeFile(projectPath(projectId), JSON.stringify(project, null, 2));
  return true;
}

export async function addCoherenceReport(
  projectId: string,
  report: Omit<CoherenceReport, "id" | "createdAt">
): Promise<CoherenceReport | null> {
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
  await fs.writeFile(projectPath(projectId), JSON.stringify(project, null, 2));
  return full;
}
