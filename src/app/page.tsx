import { Suspense } from "react";
import HomePage from "./HomePageClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-muted">Loading…</div>}>
      <HomePage />
    </Suspense>
  );
}
