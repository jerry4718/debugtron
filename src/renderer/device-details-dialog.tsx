import { Button, Dialog, FormGroup, Tag } from "@blueprintjs/core";
import { type FC } from "react";
import { useSelector } from "react-redux";

import { appSlice } from "../reducers/app";
import { targetSlice } from "../reducers/target";

interface DeviceDetailsDialogProps {
  isOpen: boolean;
  deviceId?: string;
  onClose: () => void;
  onRemove?: (deviceId: string) => void;
  onRefresh?: (deviceId: string) => void;
}

export const DeviceDetailsDialog: FC<DeviceDetailsDialogProps> = ({
  isOpen,
  deviceId,
  onClose,
  onRemove,
  onRefresh,
}) => {
  const targetStore = useSelector(targetSlice.selectSlice);
  const appStore = useSelector(appSlice.selectSlice);

  const device = deviceId ? targetStore[deviceId] : undefined;

  if (!device) {
    return null;
  }

  const deviceApps = Object.values(appStore).filter(
    (app) => app.targetId === deviceId,
  );

  const isLocal = device.type === "local";

  // Parse device info for remote devices
  let connectionInfo: { address?: string; port?: string } = {};
  if (!isLocal && device.id.startsWith("remote-adb-")) {
    const parts = device.id.replace("remote-adb-", "").split(":");
    connectionInfo = {
      address: parts[0],
      port: parts[1],
    };
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Device Details"
      style={{ width: 500 }}
    >
      <div className="bp5-dialog-body">
        <FormGroup label="Device Name">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              backgroundColor: "var(--bp5-background-color)",
              borderRadius: 4,
            }}
          >
            <span style={{ fontSize: 20 }}>
              {device.type === "local" ? "💻" : "🌐"}
            </span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {device.name}
            </span>
          </div>
        </FormGroup>

        <FormGroup label="Type">
          <Tag
            size="large"
            intent={device.type === "local" ? "success" : "primary"}
          >
            {device.type === "local" ? "Local Device" : "Remote Device"}
          </Tag>
        </FormGroup>

        <FormGroup label="Status">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor:
                  device.status === "connected" ? "#0f9960" : "#5c7080",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 14, textTransform: "capitalize" }}>
              {device.status}
            </span>
          </div>
        </FormGroup>

        {!isLocal && connectionInfo.address && (
          <>
            <FormGroup label="Connection">
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "var(--bp5-background-color)",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 13,
                }}
              >
                {connectionInfo.address}
                {connectionInfo.port && `:${connectionInfo.port}`}
              </div>
            </FormGroup>
          </>
        )}

        <FormGroup label="Apps Discovered">
          <div
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "var(--bp5-intent-primary)",
            }}
          >
            {deviceApps.length}
          </div>
        </FormGroup>

        {device.lastDiscovery && (
          <FormGroup label="Last Discovery">
            <div style={{ fontSize: 14, color: "var(--bp5-text-color-muted)" }}>
              {new Date(device.lastDiscovery).toLocaleString()}
            </div>
          </FormGroup>
        )}
      </div>

      <div className="bp5-dialog-footer">
        <div className="bp5-dialog-footer-actions">
          {!isLocal && onRemove && (
            <Button
              intent="danger"
              onClick={() => {
                onRemove(device.id);
                onClose();
              }}
            >
              Remove Device
            </Button>
          )}
          {onRefresh && (
            <Button
              icon="refresh"
              onClick={() => {
                onRefresh(device.id);
              }}
            >
              Refresh Apps
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Dialog>
  );
};
