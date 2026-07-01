import { getCloudflareContext } from "@opennextjs/cloudflare";
import { HttpD1Database } from "./http-d1-db";

export async function getD1(): Promise<D1Database | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (accountId && databaseId && apiToken) {
    try {
      const db = new HttpD1Database(accountId, databaseId, apiToken) as unknown as D1Database;
      await db.prepare("SELECT 1").first();
      return db;
    } catch (e) {
      console.error("Failed to connect to remote Cloudflare D1 via REST API:", e);
    }
  }

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
