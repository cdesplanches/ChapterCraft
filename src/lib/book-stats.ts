import { BookProject, Chapter, ChapterStatus } from "./types";

/** Standard fiction estimate (~250 words per printed page). */
export const WORDS_PER_PAGE = 250;

export interface ChapterStats {
  chapterId: string;
  number: number;
  title: string;
  status: ChapterStatus;
  contentWords: number;
  outlineWords: number;
  contentChars: number;
  estimatedPages: number;
}

export interface BookStats {
  chapterCount: number;
  totalContentWords: number;
  totalOutlineWords: number;
  totalCharacters: number;
  estimatedPages: number;
  readingMinutes: number;
  statusCounts: Record<ChapterStatus, number>;
  chapters: ChapterStats[];
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

function chapterStats(chapter: Chapter): ChapterStats {
  const contentWords = countWords(chapter.content);
  return {
    chapterId: chapter.id,
    number: chapter.number,
    title: chapter.title,
    status: chapter.status,
    contentWords,
    outlineWords: countWords(chapter.outline),
    contentChars: chapter.content.length,
    estimatedPages: contentWords / WORDS_PER_PAGE,
  };
}

export function computeBookStats(project: BookProject): BookStats {
  const chapters = project.chapters.map(chapterStats);
  const totalContentWords = chapters.reduce((s, c) => s + c.contentWords, 0);
  const totalOutlineWords = chapters.reduce((s, c) => s + c.outlineWords, 0);
  const totalCharacters = chapters.reduce((s, c) => s + c.contentChars, 0);

  const statusCounts: Record<ChapterStatus, number> = {
    outline: 0,
    draft: 0,
    revision: 0,
    done: 0,
  };
  for (const ch of project.chapters) {
    statusCounts[ch.status]++;
  }

  return {
    chapterCount: project.chapters.length,
    totalContentWords,
    totalOutlineWords,
    totalCharacters,
    estimatedPages:
      totalContentWords === 0 ? 0 : Math.max(1, totalContentWords / WORDS_PER_PAGE),
    readingMinutes: Math.ceil(totalContentWords / 200),
    statusCounts,
    chapters,
  };
}

export function formatNumber(n: number, locale: string): string {
  return n.toLocaleString(locale);
}

export function formatPages(pages: number, locale: string): string {
  if (pages === 0) return "0";
  const rounded = Math.round(pages * 10) / 10;
  return rounded.toLocaleString(locale, { maximumFractionDigits: 1 });
}
