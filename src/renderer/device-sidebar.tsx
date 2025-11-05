import { Button } from "@blueprintjs/core";
import { type FC, useState } from "react";
import { useSelector } from "react-redux";

import { targetSlice } from "../reducers/target";

interface DeviceSidebarProps {
  selectedDeviceId?: string;
  onDeviceSelect: (deviceId: string) => void;
  onAddDevice: () => void;
  onDeviceDetails: (deviceId: string) => void;
}

export const DeviceSidebar: FC<DeviceSidebarProps> = ({
  selectedDeviceId,
  onDeviceSelect,
  onAddDevice,
  onDeviceDetails,
}) => {
  const targetStore = useSelector(targetSlice.selectSlice);
  const [hoveredDevice, setHoveredDevice] = useState<string>();

  const devices = Object.values(targetStore).sort((a, b) => {
    // Local devices first
    if (a.type === "local" && b.type !== "local") return -1;
    if (a.type !== "local" && b.type === "local") return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div
      style={{
        width: 200,
        backgroundColor: "var(--bp5-background-color)",
        borderRight: "1px solid var(--bp5-divider-black)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          padding: "10px 15px",
          fontWeight: "bold",
          fontSize: 12,
          color: "var(--bp5-text-color-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Devices
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {devices.map((device) => {
          const isSelected = device.id === selectedDeviceId;
          const isHovered = device.id === hoveredDevice;
          const deviceIcon = device.type === "local" ? "💻" : "🌐";

          return (
            <div
              key={device.id}
              style={{
                padding: "10px 15px",
                cursor: "pointer",
                backgroundColor: isSelected
                  ? "#137cbd"
                  : isHovered
                    ? "var(--bp5-background-color-hover)"
                    : "transparent",
                color: isSelected ? "white" : "inherit",
                transition: "background-color 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              onClick={() => {
                onDeviceSelect(device.id);
              }}
              onMouseEnter={() => {
                setHoveredDevice(device.id);
              }}
              onMouseLeave={() => {
                setHoveredDevice(undefined);
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{deviceIcon}</span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: isSelected ? "white" : "inherit",
                    }}
                  >
                    {device.name}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 4,
                    marginLeft: 24,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor:
                        device.status === "connected" ? "#0f9960" : "#5c7080",
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: isSelected
                        ? "rgba(255, 255, 255, 0.8)"
                        : "var(--bp5-text-color-muted)",
                    }}
                  >
                    {device.status}
                  </span>
                </div>
              </div>

              {isHovered && (
                <Button
                  variant="minimal"
                  size="small"
                  icon="info-sign"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeviceDetails(device.id);
                  }}
                  style={{
                    color: isSelected ? "white" : "inherit",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: 10,
          borderTop: "1px solid var(--bp5-divider-black)",
          // @ts-expect-error - Non-standard property
          WebkitAppRegion: "no-drag",
        }}
      >
        <Button
          fill
          icon="add"
          text="Add Device"
          onClick={onAddDevice}
        />
      </div>
    </div>
  );
};
