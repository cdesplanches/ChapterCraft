import type { StorageBackend } from "./backend";

export class R2StorageBackend implements StorageBackend {
  constructor(private bucket: R2Bucket) {}

  async read(key: string): Promise<string | null> {
    const obj = await this.bucket.get(key);
    if (!obj) return null;
    return obj.text();
  }

  async write(key: string, body: string): Promise<void> {
    await this.bucket.put(key, body, {
      httpMetadata: { contentType: "application/json" },
    });
  }

  async delete(key: string): Promise<boolean> {
    await this.bucket.delete(key);
    return true;
  }

  async list(prefix: string): Promise<string[]> {
    const listed = await this.bucket.list({ prefix });
    return listed.objects.map((o) => o.key);
  }
}
