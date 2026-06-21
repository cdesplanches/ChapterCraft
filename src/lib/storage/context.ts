import { getSessionUser } from "@/lib/auth/session";
import { getD1 } from "@/lib/db";
import type { StorageBackend } from "./backend";
import { D1StorageBackend } from "./d1-backend";
import { FsStorageBackend } from "./fs-backend";

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
  const db = await getD1();
  if (db) {
    return new D1StorageBackend(db);
  }

  return new FsStorageBackend();
}

export async function isCloudStorage(): Promise<boolean> {
  return Boolean(await getD1());
}
