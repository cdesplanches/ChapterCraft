#!/usr/bin/env node
/**
 * Upload local data/ files into D1 (documents table).
 *
 * Usage:
 *   node scripts/upload-local-to-d1.mjs <user-id> [--remote]
 *
 * Example:
 *   node scripts/upload-local-to-d1.mjs 0ce1ea1b-567a-4955-a380-ecae4c170f5b --remote
 *
 * Get user id from signup response or data/auth/users.json (local dev).
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const DB = "chaptercraft-db";
const userId = process.argv[2];
const remote = process.argv.includes("--remote");

if (!userId) {
  console.error("Usage: node scripts/upload-local-to-d1.mjs <user-id> [--remote]");
  process.exit(1);
}

function sqlEscape(value) {
  return value.replace(/'/g, "''");
}

function upsert(key, body) {
  const updatedAt = new Date().toISOString();
  const sql = `INSERT INTO documents (key, body, updated_at) VALUES ('${sqlEscape(key)}', '${sqlEscape(body)}', '${updatedAt}') ON CONFLICT(key) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at;`;
  const remoteFlag = remote ? " --remote" : "";
  execSync(
    `npx wrangler d1 execute ${DB}${remoteFlag} --command ${JSON.stringify(sql)}`,
    { stdio: "inherit" }
  );
}

const root = join(process.cwd(), "data");
const userProjects = join(root, "users", userId, "projects");
const legacyProjects = join(root, "projects");
const userSettings = join(root, "users", userId, "settings.json");
const legacySettings = join(root, "settings.json");

let count = 0;

function uploadProjects(dir, prefix) {
  if (!existsSync(dir)) return;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    const body = readFileSync(join(dir, file), "utf-8");
    const key = `${prefix}/${file}`;
    console.log(`→ ${key}`);
    upsert(key, body);
    count++;
  }
}

uploadProjects(userProjects, `users/${userId}/projects`);
uploadProjects(legacyProjects, `users/${userId}/projects`);

if (existsSync(userSettings)) {
  const body = readFileSync(userSettings, "utf-8");
  const key = `users/${userId}/settings.json`;
  console.log(`→ ${key}`);
  upsert(key, body);
  count++;
} else if (existsSync(legacySettings)) {
  const body = readFileSync(legacySettings, "utf-8");
  const key = `users/${userId}/settings.json`;
  console.log(`→ ${key}`);
  upsert(key, body);
  count++;
}

console.log(`Done. Uploaded ${count} document(s) to D1.`);
