import type { StorageBackend } from "./backend";

async function ensureSchema(db: D1Database) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS documents (
        key TEXT PRIMARY KEY,
        body TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    )
    .run();
  await db
    .prepare(
      "CREATE INDEX IF NOT EXISTS idx_documents_key_prefix ON documents(key)"
    )
    .run();
}

export class D1StorageBackend implements StorageBackend {
  constructor(private db: D1Database) {}

  private async ready() {
    await ensureSchema(this.db);
  }

  async read(key: string): Promise<string | null> {
    await this.ready();
    const row = await this.db
      .prepare("SELECT body FROM documents WHERE key = ?")
      .bind(key)
      .first<{ body: string }>();
    return row?.body ?? null;
  }

  async write(key: string, body: string): Promise<void> {
    await this.ready();
    const updatedAt = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO documents (key, body, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`
      )
      .bind(key, body, updatedAt)
      .run();
  }

  async delete(key: string): Promise<boolean> {
    await this.ready();
    const result = await this.db
      .prepare("DELETE FROM documents WHERE key = ?")
      .bind(key)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  async list(prefix: string): Promise<string[]> {
    await this.ready();
    const result = await this.db
      .prepare("SELECT key FROM documents WHERE key >= ? AND key < ?")
      .bind(prefix, `${prefix}\uffff`)
      .all<{ key: string }>();
    return result.results.map((row) => row.key);
  }
}
