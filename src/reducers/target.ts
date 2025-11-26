import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AppInfo {
  id: string; // Simple ID without device prefix
  name: string;
  icon: string;
  exePath?: string; // Optional, only for local

  metadata?: {
    platform?: string; // 'win32' | 'darwin' | 'linux'
    deviceInfo?: string; // For remote: 'Android TV 12'
    packageName?: string; // For Android
  };
}

export interface TargetInfo {
  id: string;
  type: "local" | "remote";
  name: string;
  status: "connected" | "disconnected" | "connecting";
  lastDiscovery?: number;
  apps: Record<string, AppInfo>; // Nested apps
}

export const targetSlice = createSlice({
  name: "target",
  initialState: {} as Record<string, TargetInfo>,
  reducers: {
    registered: (state, { payload }: PayloadAction<Omit<TargetInfo, "apps">>) => {
      state[payload.id] = {
        ...payload,
        apps: state[payload.id]?.apps ?? {},
      };
    },
    unregistered: (state, { payload: targetId }: PayloadAction<string>) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete state[targetId];
    },
    statusUpdated: (
      state,
      {
        payload,
      }: PayloadAction<{ targetId: string; status: TargetInfo["status"] }>,
    ) => {
      const target = state[payload.targetId];
      if (target) {
        target.status = payload.status;
      }
    },
    discoveryCompleted: (
      state,
      { payload: targetId }: PayloadAction<string>,
    ) => {
      const target = state[targetId];
      if (target) {
        target.lastDiscovery = Date.now();
      }
    },
    appsUpdated: (
      state,
      { payload }: PayloadAction<{ targetId: string; apps: AppInfo[] }>,
    ) => {
      const target = state[payload.targetId];
      if (target) {
        // Clear existing apps
        target.apps = {};
        // Add new apps
        payload.apps
          .sort((a, b) => (a.id < b.id ? -1 : 1))
          .forEach((app) => {
            target.apps[app.id] = app;
          });
      }
    },
  },
});
