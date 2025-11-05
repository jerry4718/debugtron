import type { Result } from "ts-results";

// Base app info without target metadata (used internally by platform adapters)
export interface BaseAppInfo {
  id: string;
  name: string;
  icon: string;
  exePath: string;
}

export interface AppReader {
  readAll(): Promise<Result<BaseAppInfo[], Error>>;
  readByPath(p: string): Promise<Result<BaseAppInfo, Error>>;
}
