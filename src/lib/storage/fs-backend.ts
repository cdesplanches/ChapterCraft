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

  /** Remove a directory and all nested files (project folder). */
  async deleteTree(key: string): Promise<boolean> {
    try {
      await fs.rm(this.filePath(key), { recursive: true, force: true });
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    const base = this.filePath(prefix);

    const walk = async (absDir: string, relSuffix: string) => {
      let entries;
      try {
        entries = await fs.readdir(absDir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        const childSuffix = relSuffix ? `${relSuffix}/${entry.name}` : entry.name;
        const key = `${prefix}/${childSuffix}`;
        if (entry.isDirectory()) {
          keys.push(key);
          await walk(path.join(absDir, entry.name), childSuffix);
        } else if (entry.isFile()) {
          keys.push(key);
        }
      }
    };

    await walk(base, "");
    return keys;
  }
}
