export interface StorageBackend {
  read(key: string): Promise<string | null>;
  write(key: string, body: string): Promise<void>;
  delete(key: string): Promise<boolean>;
  list(prefix: string): Promise<string[]>;
}
