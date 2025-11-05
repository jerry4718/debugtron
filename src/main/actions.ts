import type { Action, ThunkDispatch } from "@reduxjs/toolkit";
import { dialog } from "electron";
import { chunk } from "lodash-es";

import { type AppInfo, appSlice } from "../reducers/app";
import { type PageInfo, sessionSlice } from "../reducers/session";
import { targetSlice } from "../reducers/target";

import type { State } from "./store";
import type { RemoteDeviceOptions } from "./targets/types";
import { targetRegistry } from "./targets/registry";

type ThunkActionCreator<P1 = void, P2 = void> = (
  p1: P1,
  p2: P2,
) => (
  dispatch: ThunkDispatch<State, never, Action>,
  getState: () => State,
) => void;

export const init: ThunkActionCreator = () => async (dispatch, getState) => {
  // Initialize local targets
  await targetRegistry.initializeLocalTargets();

  // Register all targets in Redux store
  const targets = targetRegistry.getAllInfo();
  targets.forEach((target) => {
    dispatch(targetSlice.actions.registered(target));
  });

  // Discover apps from all targets
  const allApps: AppInfo[] = [];
  for (const target of targetRegistry.getAll()) {
    const appsResult = await target.discoverApps();
    if (appsResult.ok) {
      allApps.push(...appsResult.val);
      dispatch(targetSlice.actions.discoveryCompleted(target.id));
    }
  }

  dispatch(appSlice.actions.found(allApps));

  // Timer for polling debug endpoints
  setInterval(() => {
    void (async () => {
      const { session } = getState();
      const sessions = Object.values(session);

      // Collect ports from all sessions (both local and remote)
      const ports: (number | undefined)[] = [];
      const websocketUrls: (string | undefined)[] = [];

      sessions.forEach((s) => {
        if (s.connection.type === "local-process") {
          ports.push(s.connection.nodePort, s.connection.windowPort);
        } else if (s.connection.websocketUrl) {
          websocketUrls.push(s.connection.websocketUrl);
        }
      });

      // Fetch from HTTP ports (local connections)
      const validPorts = ports.filter((p): p is number => p !== undefined);
      const responses = await Promise.allSettled<PageInfo[]>(
        validPorts.map((port) =>
          fetch(`http://127.0.0.1:${port}/json`).then((res) => res.json()),
        ),
      );

      const pagess = chunk(
        responses.map((p) => (p.status === "fulfilled" ? p.value : [])),
        2,
      ).map((item) => item.flat());

      console.log(validPorts, pagess);

      dispatch(sessionSlice.actions.pageUpdated(pagess));
    })();
  }, 3000);
};

export const debug: ThunkActionCreator<AppInfo> = (app) => async (dispatch) => {
  try {
    // Get the target adapter for this app
    const target = targetRegistry.getById(app.targetId);
    if (!target) {
      throw new Error(`Target ${app.targetId} not found`);
    }

    // Launch the app using the target adapter
    const connectionResult = await target.launch(app, {});

    if (!connectionResult.ok) {
      throw connectionResult.val;
    }

    const connection = connectionResult.val;
    const sessionId = connection.connectionId;

    // Determine connection type
    let connectionType: "local-process" | "remote-adb" | "remote-websocket";
    if (target.type === "local") {
      connectionType = "local-process";
    } else if (target.id.startsWith("remote-adb")) {
      connectionType = "remote-adb";
    } else {
      connectionType = "remote-websocket";
    }

    // Add session to Redux store
    dispatch(
      sessionSlice.actions.added({
        sessionId,
        appId: app.id,
        targetId: app.targetId,
        connection: {
          type: connectionType,
          nodePort: connection.debugPorts.node,
          windowPort: connection.debugPorts.renderer,
          websocketUrl: connection.debugPorts.websocket,
        },
      }),
    );

    // Handle local process events
    if (connection.processHandle) {
      const sp = connection.processHandle;

      sp.on("error", (err: Error) => {
        dialog.showErrorBox(`Error: ${app.name}`, err.message);
      });

      sp.on("close", () => {
        dispatch(sessionSlice.actions.removed(sessionId));
        void connection.cleanup();
      });

      const handleStdout = (chunk: Buffer) => {
        dispatch(
          sessionSlice.actions.logAppended({
            sessionId,
            content: chunk.toString(),
          }),
        );
      };

      sp.stdout?.on("data", handleStdout);
      sp.stderr?.on("data", handleStdout);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    dialog.showErrorBox(`Error: ${app.name}`, errorMessage);
  }
};

export const debugPath: ThunkActionCreator<string> = () => async () => {
  // TODO:
};

export const addRemoteDevice: ThunkActionCreator<RemoteDeviceOptions>
  = (options) => async (dispatch) => {
    try {
      const targetResult = await targetRegistry.addRemoteDevice(options);

      if (!targetResult.ok) {
        throw targetResult.val;
      }

      const target = targetResult.val;

      // Register target in Redux store
      dispatch(
        targetSlice.actions.registered({
          id: target.id,
          type: target.type,
          name: target.name,
          status: "connected",
          lastDiscovery: Date.now(),
        }),
      );

      // Discover apps from the new target
      const appsResult = await target.discoverApps();
      if (appsResult.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existingApps = Object.values((dispatch as any).getState?.()?.app ?? {});
        dispatch(appSlice.actions.found([...(existingApps as AppInfo[]), ...appsResult.val]));
        dispatch(targetSlice.actions.discoveryCompleted(target.id));
      }

      void dialog.showMessageBox({
        type: "info",
        title: "Device Connected",
        message: `Successfully connected to ${target.name}`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      dialog.showErrorBox("Connection Error", errorMessage);
    }
  };

export const removeDevice: ThunkActionCreator<string> = (targetId) => (dispatch) => {
  try {
    // Remove device from registry
    targetRegistry.unregister(targetId);

    // Remove from Redux store
    dispatch(targetSlice.actions.unregistered(targetId));

    // Remove all apps from this device
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingApps = Object.values((dispatch as any).getState?.()?.app ?? {});
    const filteredApps = (existingApps as AppInfo[]).filter((app) => app.targetId !== targetId);
    dispatch(appSlice.actions.found(filteredApps));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    dialog.showErrorBox("Remove Device Error", errorMessage);
  }
};

export const refreshDeviceApps: ThunkActionCreator<string> = (targetId) => async (dispatch) => {
  try {
    const target = targetRegistry.getById(targetId);
    if (!target) {
      throw new Error(`Target ${targetId} not found`);
    }

    // Discover apps from the target
    const appsResult = await target.discoverApps();
    if (appsResult.ok) {
      // Get existing apps from other devices
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingApps = Object.values((dispatch as any).getState?.()?.app ?? {});
      const otherDeviceApps = (existingApps as AppInfo[]).filter((app) => app.targetId !== targetId);

      // Merge with new apps from this device
      dispatch(appSlice.actions.found([...otherDeviceApps, ...appsResult.val]));
      dispatch(targetSlice.actions.discoveryCompleted(targetId));
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    dialog.showErrorBox("Refresh Device Error", errorMessage);
  }
};
