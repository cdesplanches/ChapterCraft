import { NextResponse } from "next/server";
import { listProjects, createProject } from "@/lib/storage";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, pitch, synopsis, genre, targetAudience } = body;

  if (!title?.trim() || !pitch?.trim()) {
    return NextResponse.json(
      { errorKey: "titleAndPitchRequired" },
      { status: 400 }
    );
  }

  const project = await createProject({
    title: title.trim(),
    pitch: pitch.trim(),
    synopsis: synopsis?.trim() ?? "",
    genre: genre?.trim() ?? "",
    targetAudience: targetAudience?.trim() ?? "",
  });

  return NextResponse.json(project, { status: 201 });
}
