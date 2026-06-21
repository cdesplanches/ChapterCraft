import { NextResponse } from "next/server";
import { updateChapter, deleteChapter } from "@/lib/storage";
import { storageErrorResponse } from "@/lib/storage-errors";

type RouteParams = {
  params: Promise<{ id: string; chapterId: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id, chapterId } = await params;
  const body = await request.json();
  try {
    const chapter = await updateChapter(id, chapterId, body);
    if (!chapter) {
      return NextResponse.json({ errorKey: "chapterNotFound" }, { status: 404 });
    }
    return NextResponse.json(chapter);
  } catch (err) {
    const response = storageErrorResponse(err);
    if (response) return response;
    throw err;
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id, chapterId } = await params;
  const ok = await deleteChapter(id, chapterId);
  if (!ok) {
    return NextResponse.json({ errorKey: "chapterNotFound" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
