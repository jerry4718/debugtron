import { spawn } from "child_process";
import path from "node:path";

import getPort from "get-port";
import { Result } from "ts-results";
import { v4 } from "uuid";

import type { AppInfo } from "../../../reducers/target";
import type { DebugConnection, LaunchOptions, TargetAdapter } from "../types";

import { importByPlatform } from "./platforms";

export class LocalTargetAdapter implements TargetAdapter {
  type = "local" as const;
  id: string;
  name: string;

  constructor() {
    this.id = `local-${process.platform}`;
    this.name = `Local (${this.getPlatformName()})`;
  }

  private getPlatformName(): string {
    switch (process.platform) {
      case "win32":
        return "Windows";
      case "darwin":
        return "macOS";
      case "linux":
        return "Linux";
      default:
        return process.platform;
    }
  }

  async discoverApps(): Promise<Result<AppInfo[], Error>> {
    return Result.wrapAsync(async () => {
      const { adapter } = await importByPlatform();
      const result = await adapter.readAll();

      if (!result.ok) {
        throw result.val;
      }

      const apps = result.val;

      // Return apps with metadata (device context is added by caller)
      return apps.map((app) => ({
        ...app,
        metadata: {
          platform: process.platform,
        },
      }));
    });
  }

  async launch(
    app: AppInfo,
    options: LaunchOptions = {},
  ): Promise<Result<DebugConnection, Error>> {
    return Result.wrapAsync(async () => {
      if (!app.exePath) {
        throw new Error("App does not have an executable path");
      }

      const nodePort = await getPort();
      const windowPort = await getPort();

      const debugFlags = options.debugFlags ?? [
        `--inspect=${nodePort}`,
        `--remote-debugging-port=${windowPort}`,
        "--remote-allow-origins=devtools://devtools",
      ];

      const sp = spawn(app.exePath, debugFlags, {
        cwd: options.cwd ?? (process.platform === "win32" ? path.dirname(app.exePath) : "/"),
        env: options.env,
      });

      const connectionId = v4();

      const connection: DebugConnection = {
        connectionId,
        debugPorts: {
          node: nodePort,
          renderer: windowPort,
        },
        processHandle: sp,
        cleanup: () => {
          sp.kill();
          return Promise.resolve();
        },
      };

      return connection;
    });
  }

  async disconnect(): Promise<void> {
    // Cleanup is handled by the connection's cleanup function
    // This is just a placeholder for the interface
  }

  async isAvailable(): Promise<boolean> {
    try {
      await importByPlatform();
      return true;
    } catch {
      return false;
    }
  }
}
