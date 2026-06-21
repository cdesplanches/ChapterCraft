import { NextResponse } from "next/server";
import { updateChapter, deleteChapter } from "@/lib/storage";

type RouteParams = {
  params: Promise<{ id: string; chapterId: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id, chapterId } = await params;
  const body = await request.json();
  const chapter = await updateChapter(id, chapterId, body);
  if (!chapter) {
    return NextResponse.json(
      { error: "Chapitre introuvable" },
      { status: 404 }
    );
  }
  return NextResponse.json(chapter);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id, chapterId } = await params;
  const ok = await deleteChapter(id, chapterId);
  if (!ok) {
    return NextResponse.json(
      { error: "Chapitre introuvable" },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
