import { NextResponse } from "next/server";
import { addChapter } from "@/lib/storage";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const { title, outline } = body;

  if (!title?.trim()) {
    return NextResponse.json(
      { errorKey: "chapterTitleRequired" },
      { status: 400 }
    );
  }

  const chapter = await addChapter(id, {
    title: title.trim(),
    outline: outline?.trim() ?? "",
  });

  if (!chapter) {
    return NextResponse.json({ errorKey: "projectNotFound" }, { status: 404 });
  }

  return NextResponse.json(chapter, { status: 201 });
}
