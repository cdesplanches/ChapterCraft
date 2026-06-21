import { NextResponse } from "next/server";
import { DocumentTooLargeError } from "./storage/project-store";

export function storageErrorResponse(err: unknown): NextResponse | null {
  if (err instanceof DocumentTooLargeError) {
    return NextResponse.json({ errorKey: "chapterTooLarge" }, { status: 413 });
  }
  return null;
}
