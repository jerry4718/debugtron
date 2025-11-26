import { type FC, useState } from "react";
import { useSelector } from "react-redux";

import { targetSlice } from "../reducers/target";

import defaultImage from "./images/electron.png";

interface DevicePanelProps {
  selectedDeviceId?: string;
  onDeviceSettings: () => void;
}

export const DevicePanel: FC<DevicePanelProps> = ({
  selectedDeviceId,
  onDeviceSettings,
}) => {
  const targetStore = useSelector(targetSlice.selectSlice);
  const [input, setInput] = useState("");

  const target = selectedDeviceId ? targetStore[selectedDeviceId] : undefined;

  // Get apps from the target
  const deviceApps = target ? Object.values(target.apps) : [];

  if (!target) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-base">
        Select a device to view apps
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Device Header */}
      <div
        className="px-4 py-2.5 border-b border-border bg-background flex items-center justify-between"
        style={{
          // @ts-expect-error - Non-standard property
          WebkitAppRegion: "no-drag",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">
            {target.type === "local" ? "💻" : "🌐"}
          </span>
          <div>
            <div className="text-base font-semibold">
              {target.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {deviceApps.length} app{deviceApps.length !== 1 ? "s" : ""} found
            </div>
          </div>
        </div>
        <button
          onClick={onDeviceSettings}
          className="p-2 rounded hover:bg-accent transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M14 8a6 6 0 1 1-12 0 6 6 0 0 1 12 0z"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
          </svg>
        </button>
      </div>

      {/* App List */}
      <div className="flex-1 overflow-y-auto p-4">
        {deviceApps.length === 0
          ? (
            <div className="text-center text-muted-foreground py-10 px-5">
              No apps found on this device
            </div>
          )
          : (
            <div className="flex flex-col gap-2">
              {deviceApps.map((app) => (
                <div
                  key={app.id}
                  className="p-3 border border-border rounded hover:bg-accent/50 transition-colors cursor-pointer flex items-center gap-3"
                  onClick={() => {
                    if (selectedDeviceId) {
                      window.debugtronAPI.debug({ targetId: selectedDeviceId, app });
                    }
                  }}
                >
                  <img
                    src={app.icon || defaultImage}
                    alt=""
                    className="w-8 h-8 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {app.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {app.metadata?.packageName ?? app.id.split(":").pop()}
                    </div>
                  </div>
                  <button
                    className="p-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    title="Debug this app"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M3 2l6 4-6 4V2z" fill="currentColor" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Custom Path Input (for local devices) */}
      {target.type === "local" && (
        <div
          className="p-4 border-t border-border bg-background"
          style={{
            // @ts-expect-error - Non-standard property
            WebkitAppRegion: "no-drag",
          }}
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              placeholder="App not found? Enter custom path..."
              onChange={(e) => {
                setInput(e.target.value);
              }}
              className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              title="Input custom path here and click Debug"
            />
            <button
              onClick={() => {
                window.debugtronAPI.debugPath(input);
              }}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 2l6 4-6 4V2z" fill="currentColor" />
              </svg>
              Debug
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
