import { Result } from "ts-results";

import type { RemoteDeviceOptions, TargetAdapter, TargetInfo } from "./types";

export class TargetRegistry {
  private targets = new Map<string, TargetAdapter>();

  register(target: TargetAdapter): void {
    this.targets.set(target.id, target);
  }

  unregister(targetId: string): void {
    this.targets.delete(targetId);
  }

  getAll(): TargetAdapter[] {
    return Array.from(this.targets.values());
  }

  getById(targetId: string): TargetAdapter | undefined {
    return this.targets.get(targetId);
  }

  getAllInfo(): TargetInfo[] {
    return this.getAll().map((target) => ({
      id: target.id,
      type: target.type,
      name: target.name,
      status: "connected" as const,
      lastDiscovery: Date.now(),
    }));
  }

  async initializeLocalTargets(): Promise<void> {
    // Import and register local platform adapter
    const { LocalTargetAdapter } = await import("./local/adapter");
    const localAdapter = new LocalTargetAdapter();
    this.register(localAdapter);
  }

  async addRemoteDevice(
    options: RemoteDeviceOptions,
  ): Promise<Result<TargetAdapter, Error>> {
    return Result.wrapAsync(async () => {
      let adapter: TargetAdapter;

      switch (options.type) {
        case "adb": {
          const { AdbTargetAdapter } = await import("./remote/adb");
          adapter = new AdbTargetAdapter(options.address, options.port);
          break;
        }
        case "ssh":
        case "websocket":
          throw new Error(`Target type ${options.type} not yet implemented`);
        default:
          throw new Error(`Unknown target type: ${options.type}`);
      }

      // Check if device is available before registering
      const isAvailable = await adapter.isAvailable();
      if (!isAvailable) {
        throw new Error(`Device at ${options.address} is not available`);
      }

      this.register(adapter);
      return adapter;
    });
  }
}

// Singleton instance
export const targetRegistry = new TargetRegistry();
