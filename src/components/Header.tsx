import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-2xl" aria-hidden>
            ✒️
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight group-hover:text-accent transition-colors">
              ChapterCraft
            </h1>
            <p className="text-xs text-muted">Assistant de rédaction</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
