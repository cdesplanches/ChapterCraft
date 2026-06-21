import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getD1(): Promise<D1Database | null> {
  try {
    const { env } = getCloudflareContext();
    const db = env.DB;
    if (!db) return null;
    await db.prepare("SELECT 1").first();
    return db;
  } catch {
    return null;
  }
}
