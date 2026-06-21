import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No R2/KV: app data lives in D1; Next.js incremental cache stays in-memory ("dummy").
export default defineCloudflareConfig({
  incrementalCache: "dummy",
  tagCache: "dummy",
  queue: "dummy",
});
