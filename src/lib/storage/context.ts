import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSessionUser } from "@/lib/auth/session";
import type { StorageBackend } from "./backend";
import { FsStorageBackend } from "./fs-backend";
import { R2StorageBackend } from "./r2-backend";

/** Storage prefix user id from authenticated session. */
export async function getStorageUserId(): Promise<string> {
  const user = await getSessionUser();
  if (user) return user.id;

  throw new Error("UNAUTHORIZED");
}

export function userKey(userId: string, ...parts: string[]): string {
  return ["users", userId, ...parts].join("/");
}

export async function getStorageBackend(): Promise<StorageBackend> {
  try {
    const { env } = getCloudflareContext();
    const bucket = env.DATA_BUCKET;
    if (bucket) {
      return new R2StorageBackend(bucket);
    }
  } catch {
    // Not running in Cloudflare Workers (e.g. plain next dev without bindings)
  }

  return new FsStorageBackend();
}

export async function isCloudStorage(): Promise<boolean> {
  try {
    const { env } = getCloudflareContext();
    return Boolean(env.DATA_BUCKET);
  } catch {
    return false;
  }
}
