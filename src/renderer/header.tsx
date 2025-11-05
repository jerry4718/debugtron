import { Button, ControlGroup, Dialog, FormGroup, InputGroup, MenuItem, Radio, RadioGroup, Tooltip } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { type FC, useState } from "react";
import { useSelector } from "react-redux";

import { appSlice } from "../reducers/app";

import defaultImage from "./images/electron.png";

export const Header: FC = () => {
  const appState = useSelector(appSlice.selectSlice);
  const [input, setInput] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deviceType, setDeviceType] = useState<"adb" | "ssh" | "websocket">("adb");
  const [deviceAddress, setDeviceAddress] = useState("");
  const [devicePort, setDevicePort] = useState("5555");

  const handleAddDevice = () => {
    window.debugtronAPI.addRemoteDevice({
      type: deviceType,
      address: deviceAddress,
      port: parseInt(devicePort, 10),
    });
    setDialogOpen(false);
    setDeviceAddress("");
    setDevicePort("5555");
  };

  return (
    <header
      style={{
        padding: "10px 10px 10px 80px",
        display: "flex",
        // @ts-expect-error - Non-standard property
        WebkitAppRegion: "drag",
      }}
    >
      <Select
        menuProps={{
          style: {
            maxHeight: "calc(100vh - 100px)", // TODO:
            overflow: "auto",
          },
        }}
        filterable
        items={Object.values(appState)}
        itemPredicate={(query, item) => {
          const lq = query.toLowerCase();
          return (
            item.name.toLowerCase().includes(lq)
            || item.id.toLowerCase().includes(lq)
          );
        }}
        itemRenderer={(item, { modifiers, handleClick, handleFocus }) => {
          if (!modifiers.matchesPredicate) return null;

          const targetIndicator = item.targetType === "remote"
            ? "🌐 "
            : "💻 ";

          return (
            <MenuItem
              key={item.id}
              text={`${targetIndicator}${item.name}`}
              label={item.metadata?.deviceInfo ?? item.metadata?.platform ?? ""}
              onClick={handleClick}
              onFocus={handleFocus}
              icon={
                <img
                  style={{ width: 24, height: 24 }}
                  src={item.icon || defaultImage}
                />
              }
            />
          );
        }}
        onItemSelect={(item) => {
          const appInfo = appState[item.id];
          if (appInfo) {
            window.debugtronAPI.debug(appInfo);
          }
        }}
      >
        <Button
          style={{
            // @ts-expect-error - Non-standard property
            WebkitAppRegion: "no-drag",
          }}
          text="Select an App to debug"
          icon="build"
          endIcon="chevron-down"
        />
      </Select>
      <div
        style={{
          flexGrow: 1,
          textAlign: "center",
          display: "flex",
          flexFlow: "column",
          justifyContent: "center",
        }}
      >
        Debugtron
      </div>
      <ControlGroup style={{
        // @ts-expect-error - Non-standard property
        WebkitAppRegion: "no-drag",
      }}
      >
        <Tooltip content="Input custom path here and click Debug">
          <InputGroup
            value={input}
            placeholder="App not found?"
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
        <Button
          text="Add Device"
          icon="new-object"
          onClick={() => {
            setDialogOpen(true);
          }}
        />
      </ControlGroup>

      <Dialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
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
                setDialogOpen(false);
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
    </header>
  );
};
