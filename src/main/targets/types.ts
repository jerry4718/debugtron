import type { ChildProcess } from "child_process";
import type { Result } from "ts-results";

import type { AppInfo } from "../../reducers/target";

export type TargetType = "local" | "remote";

export interface LaunchOptions {
  debugFlags?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export interface DebugConnection {
  connectionId: string;
  debugPorts: {
    node?: number;
    renderer?: number;
    websocket?: string; // For remote WS connections
  };
  processHandle?: ChildProcess; // Only for local
  cleanup: () => Promise<void>;
}

export interface TargetAdapter {
  // Metadata
  type: TargetType;
  id: string; // e.g., 'local-macos', 'remote-adb-192.168.1.100'
  name: string;

  // Discovery
  discoverApps(): Promise<Result<AppInfo[], Error>>;

  // Launch & Connect
  launch(app: AppInfo, options: LaunchOptions): Promise<Result<DebugConnection, Error>>;

  // Connection management
  disconnect(connectionId: string): Promise<void>;

  // Health check
  isAvailable(): Promise<boolean>;
}

export interface TargetInfo {
  id: string;
  type: TargetType;
  name: string;
  status: "connected" | "disconnected" | "connecting";
  lastDiscovery?: number;
}

export interface RemoteDeviceOptions {
  type: "adb" | "ssh" | "websocket";
  address: string;
  port?: number;
  username?: string;
  password?: string;
}
