import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getD1 } from "@/lib/db";
import { User, UserRecord } from "./types";

const AUTH_FILE = path.join(process.cwd(), "data", "auth", "users.json");

interface UserStore {
  users: UserRecord[];
}

async function getDb(): Promise<D1Database | null> {
  return getD1();
}

async function ensureD1Schema(db: D1Database) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      )`
    )
    .run();
  await db
    .prepare("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
    .run();
}

async function findUserByEmailD1(
  db: D1Database,
  normalized: string
): Promise<UserRecord | null> {
  await ensureD1Schema(db);
  const row = await db
    .prepare(
      "SELECT id, email, password_hash, name, created_at FROM users WHERE email = ?"
    )
    .bind(normalized)
    .first<{
      id: string;
      email: string;
      password_hash: string;
      name: string;
      created_at: string;
    }>();
  return row ? rowToRecord(row) : null;
}

async function readFsStore(): Promise<UserStore> {
  try {
    const raw = await fs.readFile(AUTH_FILE, "utf-8");
    return JSON.parse(raw) as UserStore;
  } catch {
    return { users: [] };
  }
}

async function writeFsStore(store: UserStore) {
  await fs.mkdir(path.dirname(AUTH_FILE), { recursive: true });
  await fs.writeFile(AUTH_FILE, JSON.stringify(store, null, 2));
}

function rowToRecord(row: {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
}): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    createdAt: row.created_at,
  };
}

function toPublicUser(record: UserRecord): User {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    createdAt: record.createdAt,
  };
}

export async function findUserByEmail(
  email: string
): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();
  const db = await getDb();

  if (db) {
    try {
      return await findUserByEmailD1(db, normalized);
    } catch {
      // Fall back to filesystem when local D1 is unavailable
    }
  }

  const store = await readFsStore();
  return store.users.find((u) => u.email === normalized) ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const db = await getDb();

  if (db) {
    try {
      await ensureD1Schema(db);
      const row = await db
        .prepare(
          "SELECT id, email, password_hash, name, created_at FROM users WHERE id = ?"
        )
        .bind(id)
        .first<{
          id: string;
          email: string;
          password_hash: string;
          name: string;
          created_at: string;
        }>();
      return row ? toPublicUser(rowToRecord(row)) : null;
    } catch {
      // Fall back to filesystem when local D1 is unavailable
    }
  }

  const store = await readFsStore();
  const record = store.users.find((u) => u.id === id);
  return record ? toPublicUser(record) : null;
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  name: string;
}): Promise<User> {
  const normalized = data.email.trim().toLowerCase();
  const existing = await findUserByEmail(normalized);
  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }

  const record: UserRecord = {
    id: uuidv4(),
    email: normalized,
    passwordHash: data.passwordHash,
    name: data.name.trim(),
    createdAt: new Date().toISOString(),
  };

  const db = await getDb();
  if (db) {
    try {
      await ensureD1Schema(db);
      await db
        .prepare(
          "INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(
          record.id,
          record.email,
          record.passwordHash,
          record.name,
          record.createdAt
        )
        .run();
      return toPublicUser(record);
    } catch {
      // Fall back to filesystem when local D1 is unavailable
    }
  }

  const store = await readFsStore();
  store.users.push(record);
  await writeFsStore(store);
  return toPublicUser(record);
}
