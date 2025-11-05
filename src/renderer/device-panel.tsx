import { Button, ControlGroup, InputGroup, Tooltip } from "@blueprintjs/core";
import { type FC, useState } from "react";
import { useSelector } from "react-redux";

import { appSlice } from "../reducers/app";
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
  const appStore = useSelector(appSlice.selectSlice);
  const targetStore = useSelector(targetSlice.selectSlice);
  const [input, setInput] = useState("");

  const device = selectedDeviceId ? targetStore[selectedDeviceId] : undefined;

  // Filter apps for the selected device
  const deviceApps = Object.values(appStore).filter(
    (app) => app.targetId === selectedDeviceId,
  );

  if (!device) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--bp5-text-color-muted)",
          fontSize: 16,
        }}
      >
        Select a device to view apps
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Device Header */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--bp5-divider-black)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--bp5-background-color)",
          // @ts-expect-error - Non-standard property
          WebkitAppRegion: "no-drag",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>
            {device.type === "local" ? "💻" : "🌐"}
          </span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {device.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--bp5-text-color-muted)" }}>
              {deviceApps.length} app{deviceApps.length !== 1 ? "s" : ""} found
            </div>
          </div>
        </div>
        <Button
          variant="minimal"
          icon="cog"
          onClick={onDeviceSettings}
        />
      </div>

      {/* App List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 16px 16px",
        }}
      >
        {deviceApps.length === 0
          ? (
            <div
              style={{
                textAlign: "center",
                color: "var(--bp5-text-color-muted)",
                padding: "40px 20px",
              }}
            >
              No apps found on this device
            </div>
          )
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {deviceApps.map((app) => (
                <div
                  key={app.id}
                  style={{
                    padding: 12,
                    border: "1px solid var(--bp5-divider-black)",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  className="app-item"
                  onClick={() => {
                    window.debugtronAPI.debug(app);
                  }}
                >
                  <img
                    src={app.icon || defaultImage}
                    alt=""
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 4,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {app.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--bp5-text-color-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {app.metadata?.packageName ?? app.id.split(":").pop()}
                    </div>
                  </div>
                  <Button
                    size="small"
                    icon="play"
                    intent="primary"
                    title="Debug this app"
                  />
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Custom Path Input (for local devices) */}
      {device.type === "local" && (
        <div
          style={{
            padding: 16,
            borderTop: "1px solid var(--bp5-divider-black)",
            backgroundColor: "var(--bp5-background-color)",
            // @ts-expect-error - Non-standard property
            WebkitAppRegion: "no-drag",
          }}
        >
          <ControlGroup fill>
            <Tooltip content="Input custom path here and click Debug">
              <InputGroup
                value={input}
                placeholder="App not found? Enter custom path..."
                onChange={(e) => {
                  setInput(e.target.value);
                }}
              />
            </Tooltip>
            <Button
              text="Debug"
              icon="build"
              onClick={() => {
                window.debugtronAPI.debugPath(input);
              }}
            />
          </ControlGroup>
        </div>
      )}
    </div>
  );
};
