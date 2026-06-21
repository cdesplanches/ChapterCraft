import { NextResponse } from "next/server";
import { getProject, updateProject, deleteProject } from "@/lib/storage";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ errorKey: "projectNotFound" }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const project = await updateProject(id, body);
  if (!project) {
    return NextResponse.json({ errorKey: "projectNotFound" }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const ok = await deleteProject(id);
  if (!ok) {
    return NextResponse.json({ errorKey: "projectNotFound" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
