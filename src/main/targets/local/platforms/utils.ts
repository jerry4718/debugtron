// Base app info without target metadata (used internally by platform adapters)
export interface BaseAppInfo {
  id: string;
  name: string;
  icon: string;
  exePath: string;
}

export interface AppReader {
  readAll(): Promise<BaseAppInfo[]>;
  readByPath(p: string): Promise<BaseAppInfo>;
}
