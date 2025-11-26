import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { app, BrowserWindow, ipcMain, Menu, MenuItem, nativeImage, shell } from "electron";

import type { AppInfo } from "./reducers/target";

import { addRemoteDevice, debug, debugPath, init, refreshDeviceApps, removeDevice } from "./main/actions";
import { store } from "./main/store";
import type { RemoteDeviceOptions } from "./main/targets/types";
import { setReporter, setUpdater } from "./main/utils";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
import squirrelStartup from "electron-squirrel-startup";
if (squirrelStartup) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 14, y: 14 },
    icon: process.platform === "linux"
      ? nativeImage.createFromPath(path.join(__dirname, "../../assets/icon.png"))
      : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  store.dispatch(
    // @ts-expect-error - Redux thunk action dispatch
    init(),
  );

  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on("ready", () => {
    if (app.isPackaged) {
      void setReporter();
    } else {
      void import("electron-devtools-installer").then((devtools) => {
        void devtools.default(devtools.REACT_DEVELOPER_TOOLS);
        void devtools.default(devtools.REDUX_DEVTOOLS);
      });
    }

    const defaultMenu = Menu.getApplicationMenu();
    if (defaultMenu) {
      defaultMenu.append(
        new MenuItem({
          label: "About",
          submenu: [
            {
              label: "Source Code",
              click() {
                void shell.openExternal("https://github.com/pd4d10/debugtron");
              },
            },
            {
              label: "Submit an Issue",
              click() {
                void shell.openExternal("https://github.com/pd4d10/debugtron/issues/new");
              },
            },
          ],
        }),
      );
    }

    ipcMain.on("debug", (e, payload: { targetId: string; app: AppInfo }) => {
      store.dispatch(
        // @ts-expect-error - Redux thunk action dispatch
        debug(payload),
      );
    });
    ipcMain.on("debug-path", (_, path: string) => {
      store.dispatch(
        // @ts-expect-error - Redux thunk action dispatch
        debugPath(path),
      );
    });
    ipcMain.on("add-remote-device", (_, options: RemoteDeviceOptions) => {
      store.dispatch(
        // @ts-expect-error - Redux thunk action dispatch
        addRemoteDevice(options),
      );
    });
    ipcMain.on("remove-device", (_, targetId: string) => {
      store.dispatch(
        // @ts-expect-error - Redux thunk action dispatch
        removeDevice(targetId),
      );
    });
    ipcMain.on("refresh-device-apps", (_, targetId: string) => {
      store.dispatch(
        // @ts-expect-error - Redux thunk action dispatch
        refreshDeviceApps(targetId),
      );
    });
    ipcMain.on("open-devtools", (_, url: string) => {
      const win = new BrowserWindow();
      // console.log(url)
      void win.loadURL(url);
    });

    setUpdater();
    createWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate",  () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
}
