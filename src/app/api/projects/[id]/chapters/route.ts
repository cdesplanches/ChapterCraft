import { NextResponse } from "next/server";
import { addChapter } from "@/lib/storage";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const { title, outline } = body;

  if (!title?.trim()) {
    return NextResponse.json(
      { error: "Le titre du chapitre est requis" },
      { status: 400 }
    );
  }

  const chapter = await addChapter(id, {
    title: title.trim(),
    outline: outline?.trim() ?? "",
  });

  if (!chapter) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  return NextResponse.json(chapter, { status: 201 });
}
