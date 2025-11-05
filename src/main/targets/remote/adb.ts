import { exec } from "child_process";
import { promisify } from "util";

import { Result } from "ts-results";
import { v4 } from "uuid";

import type { AppInfo } from "../../../reducers/app";
import type { DebugConnection, TargetAdapter } from "../types";

const execAsync = promisify(exec);

export class AdbTargetAdapter implements TargetAdapter {
  type = "remote" as const;
  id: string;
  name: string;
  private address: string;
  private port: number;

  constructor(address: string, port = 5555) {
    this.address = address;
    this.port = port;
    this.id = `remote-adb-${address}:${port}`;
    this.name = `ADB Device (${address}:${port})`;
  }

  private async execAdb(args: string[]): Promise<string> {
    const deviceArg = `-s ${this.address}:${this.port}`;
    const command = `adb ${deviceArg} ${args.join(" ")}`;
    const { stdout } = await execAsync(command);
    return stdout.trim();
  }

  async isAvailable(): Promise<boolean> {
    try {
      // First connect to the device
      await execAsync(`adb connect ${this.address}:${this.port}`);

      // Then check if device is accessible
      const { stdout } = await execAsync("adb devices");
      return stdout.includes(`${this.address}:${this.port}`);
    } catch {
      return false;
    }
  }

  async discoverApps(): Promise<Result<AppInfo[], Error>> {
    return Result.wrapAsync(async () => {
      // Get list of third-party packages
      const packagesOutput = await this.execAdb([
        "shell",
        "pm",
        "list",
        "packages",
        "-3",
      ]);

      const packageNames = packagesOutput
        .split("\n")
        .filter((line) => line.startsWith("package:"))
        .map((line) => line.replace("package:", "").trim());

      // Get app labels for each package
      const apps: AppInfo[] = packageNames.map((packageName) => {
        const label = packageName;
        // TODO: Try to get app label from package manager
        // This is a simplified approach - ideally we'd parse the APK using aapt
        // For now, we just use the package name

        return {
          id: `${this.id}:${packageName}`,
          name: label,
          icon: "", // TODO: Extract app icon from APK
          targetId: this.id,
          targetType: "remote" as const,
          metadata: {
            packageName,
            deviceInfo: `ADB ${this.address}:${this.port}`,
          },
        };
      });

      return apps;
    });
  }

  async launch(
    app: AppInfo,
  ): Promise<Result<DebugConnection, Error>> {
    return Result.wrapAsync(async () => {
      // Extract package name from app metadata or ID
      const packageName = app.metadata?.packageName ?? app.id.replace(`${this.id}:`, "");

      // Get the main activity for the package
      const activityOutput = await this.execAdb([
        "shell",
        "pm",
        "dump",
        packageName,
        "|",
        "grep",
        "-A1",
        "android.intent.action.MAIN",
      ]);

      let mainActivity: string;
      const activityMatch = /([a-zA-Z0-9_.]+\/[a-zA-Z0-9_.]+)/.exec(activityOutput);
      if (activityMatch?.[1]) {
        mainActivity = activityMatch[1];
      } else {
        // Fallback: try to launch the package directly
        mainActivity = `${packageName}/.MainActivity`;
      }

      // Launch the app with debug flags
      // For Chrome-based Android apps, we need to enable remote debugging
      await this.execAdb([
        "shell",
        "am",
        "start",
        "-D", // Wait for debugger
        "-W", // Wait for launch to complete
        mainActivity,
      ]);

      // Wait a bit for the app to start
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get the Chrome DevTools debugging URL
      // For Android WebView/Chrome apps, check port 9222
      let debugPort = 9222;

      // Forward the debugging port
      await execAsync(
        `adb -s ${this.address}:${this.port} forward tcp:0 localabstract:chrome_devtools_remote`,
      );

      // Try to discover the actual forwarded port
      const forwardOutput = await execAsync("adb forward --list");
      const forwardMatch = new RegExp(`${this.address}:${this.port}\\s+tcp:(\\d+)`).exec(forwardOutput.stdout);
      if (forwardMatch?.[1]) {
        debugPort = parseInt(forwardMatch[1], 10);
      }

      // Get the WebSocket debugging URL
      let websocketUrl: string | undefined;
      try {
        const { stdout } = await execAsync(
          `curl -s http://localhost:${debugPort}/json`,
        );
        const pages = JSON.parse(stdout) as { webSocketDebuggerUrl?: string }[];
        if (pages.length > 0 && pages[0]?.webSocketDebuggerUrl) {
          websocketUrl = pages[0].webSocketDebuggerUrl;
        }
      } catch {
        // If we can't get the WebSocket URL, provide the HTTP endpoint
        websocketUrl = `ws://localhost:${debugPort}`;
      }

      const connectionId = v4();

      const connection: DebugConnection = {
        connectionId,
        debugPorts: {
          websocket: websocketUrl ?? `ws://localhost:${debugPort}`,
        },
        cleanup: async () => {
          // Force stop the app
          await this.execAdb(["shell", "am", "force-stop", packageName]);
          // Remove port forwarding
          await execAsync(
            `adb -s ${this.address}:${this.port} forward --remove-all`,
          );
        },
      };

      return connection;
    });
  }

  async disconnect(): Promise<void> {
    // Cleanup is handled by the connection's cleanup function
  }
}
