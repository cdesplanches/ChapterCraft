import { promises as fs } from "fs";
import path from "path";
import type { StorageBackend } from "./backend";

const DATA_ROOT = path.join(process.cwd(), "data");

export class FsStorageBackend implements StorageBackend {
  private root: string;

  constructor(root = DATA_ROOT) {
    this.root = root;
  }

  private filePath(key: string) {
    return path.join(this.root, key);
  }

  async read(key: string): Promise<string | null> {
    try {
      return await fs.readFile(this.filePath(key), "utf-8");
    } catch {
      return null;
    }
  }

  async write(key: string, body: string): Promise<void> {
    const filePath = this.filePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, body, "utf-8");
  }

  async delete(key: string): Promise<boolean> {
    try {
      await fs.unlink(this.filePath(key));
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix: string): Promise<string[]> {
    const dir = this.filePath(prefix);
    try {
      const entries = await fs.readdir(dir);
      return entries.map((name) => `${prefix}/${name}`);
    } catch {
      return [];
    }
  }
}
