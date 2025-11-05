import { sessionSlice } from "../reducers/session";
import { targetSlice } from "../reducers/target";

import "./app.css";
import { Colors, Dialog, FormGroup, InputGroup, Radio, RadioGroup, Button } from "@blueprintjs/core";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useMedia } from "react-use";

import { DeviceDetailsDialog } from "./device-details-dialog";
import { DevicePanel } from "./device-panel";
import { DeviceSidebar } from "./device-sidebar";
import { Session } from "./session";

export const App: React.FC = () => {
  const darkMode = useMedia("(prefers-color-scheme: dark)");
  const sessionStore = useSelector(sessionSlice.selectSlice);
  const targetStore = useSelector(targetSlice.selectSlice);

  // Device management state
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>();
  const [deviceDetailsOpen, setDeviceDetailsOpen] = useState(false);
  const [deviceDetailsId, setDeviceDetailsId] = useState<string>();
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);

  // Remote device dialog state
  const [deviceType, setDeviceType] = useState<"adb" | "ssh" | "websocket">("adb");
  const [deviceAddress, setDeviceAddress] = useState("");
  const [devicePort, setDevicePort] = useState("5555");

  // Auto-select first device (local) on startup
  useEffect(() => {
    if (!selectedDeviceId && Object.keys(targetStore).length > 0) {
      const devices = Object.values(targetStore);
      const localDevice = devices.find((d) => d.type === "local");
      if (localDevice) {
        setSelectedDeviceId(localDevice.id);
      } else if (devices[0]) {
        setSelectedDeviceId(devices[0].id);
      }
    }
  }, [targetStore, selectedDeviceId]);

  const handleAddDevice = () => {
    window.debugtronAPI.addRemoteDevice({
      type: deviceType,
      address: deviceAddress,
      port: parseInt(devicePort, 10),
    });
    setAddDeviceOpen(false);
    setDeviceAddress("");
    setDevicePort("5555");
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: darkMode ? Colors.DARK_GRAY2 : undefined,
      }}
      className={darkMode ? "bp5-dark" : undefined}
    >
      {/* Draggable Title Bar */}
      <div
        style={{
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid var(--bp5-divider-black)",
          backgroundColor: "var(--bp5-background-color)",
          // @ts-expect-error - Non-standard property
          WebkitAppRegion: "drag",
          fontSize: 14,
          fontWeight: 500,
          color: "var(--bp5-text-color)",
        }}
      >
        Debugtron
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left Sidebar - Device List */}
        <DeviceSidebar
          selectedDeviceId={selectedDeviceId}
          onDeviceSelect={setSelectedDeviceId}
          onAddDevice={() => {
            setAddDeviceOpen(true);
          }}
          onDeviceDetails={(deviceId) => {
            setDeviceDetailsId(deviceId);
            setDeviceDetailsOpen(true);
          }}
        />

        {/* Middle: App List - Always shows apps for selected device */}
        <div
          style={{
            width: 300,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--bp5-divider-black)",
            overflow: "hidden",
          }}
        >
          <DevicePanel
            selectedDeviceId={selectedDeviceId}
            onDeviceSettings={() => {
              if (selectedDeviceId) {
                setDeviceDetailsId(selectedDeviceId);
                setDeviceDetailsOpen(true);
              }
            }}
          />
        </div>

        {/* Right: Session Details - Shows debugging sessions */}
        {Object.keys(sessionStore).length > 0
          ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <Session />
            </div>
          )
          : (
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
              Select an app to start debugging
            </div>
          )}
      </div>

      {/* Device Details Dialog */}
      <DeviceDetailsDialog
        isOpen={deviceDetailsOpen}
        deviceId={deviceDetailsId}
        onClose={() => {
          setDeviceDetailsOpen(false);
        }}
        onRemove={(deviceId) => {
          window.debugtronAPI.removeDevice(deviceId);
          // Switch to local device if removing current device
          if (deviceId === selectedDeviceId) {
            const localDevice = Object.values(targetStore).find((d) => d.type === "local");
            if (localDevice) {
              setSelectedDeviceId(localDevice.id);
            }
          }
        }}
        onRefresh={(deviceId) => {
          window.debugtronAPI.refreshDeviceApps(deviceId);
        }}
      />

      {/* Add Remote Device Dialog */}
      <Dialog
        isOpen={addDeviceOpen}
        onClose={() => {
          setAddDeviceOpen(false);
        }}
        title="Add Remote Device"
      >
        <div className="bp5-dialog-body">
          <FormGroup label="Device Type" labelFor="device-type">
            <RadioGroup
              id="device-type"
              selectedValue={deviceType}
              onChange={(e) => {
                setDeviceType(e.currentTarget.value as "adb" | "ssh" | "websocket");
              }}
            >
              <Radio label="ADB (Android Debug Bridge)" value="adb" />
              <Radio label="SSH (Coming soon)" value="ssh" disabled />
              <Radio label="WebSocket (Coming soon)" value="websocket" disabled />
            </RadioGroup>
          </FormGroup>

          <FormGroup label="Device Address" labelFor="device-address">
            <InputGroup
              id="device-address"
              placeholder="e.g., 192.168.1.100"
              value={deviceAddress}
              onChange={(e) => {
                setDeviceAddress(e.target.value);
              }}
            />
          </FormGroup>

          <FormGroup label="Port" labelFor="device-port">
            <InputGroup
              id="device-port"
              placeholder="5555"
              value={devicePort}
              onChange={(e) => {
                setDevicePort(e.target.value);
              }}
            />
          </FormGroup>
        </div>
        <div className="bp5-dialog-footer">
          <div className="bp5-dialog-footer-actions">
            <Button
              onClick={() => {
                setAddDeviceOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              intent="primary"
              onClick={handleAddDevice}
              disabled={!deviceAddress}
            >
              Connect
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
