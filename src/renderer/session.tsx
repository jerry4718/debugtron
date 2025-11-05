import { Button, HTMLTable, Tab, Tabs, Tag, Callout } from "@blueprintjs/core";
import { type FC, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { appSlice } from "../reducers/app";
import { sessionSlice } from "../reducers/session";
import { targetSlice } from "../reducers/target";

import { Xterm } from "./xterm";

export const Session: FC = () => {
  const [activeId, setActiveId] = useState("");
  const appStore = useSelector(appSlice.selectSlice);
  const sessionStore = useSelector(sessionSlice.selectSlice);
  const targetStore = useSelector(targetSlice.selectSlice);

  useEffect(() => {
    const sessionIds = Object.keys(sessionStore);

    // Ensure there always be one tab active
    if (!sessionIds.includes(activeId) && sessionIds[0]) {
      setActiveId(sessionIds[0]);
    }
  }, [activeId, sessionStore]);

  return (
    <Tabs
      selectedTabId={activeId}
      onChange={(key) => {
        setActiveId(key as string);
      }}
    >
      {Object.entries(sessionStore).map(([id, session]) => {
        const appInfo = appStore[session.appId];
        const targetInfo = targetStore[session.targetId];

        // Create tab title with device name
        const tabTitle = appInfo
          ? `${appInfo.name} (${targetInfo?.name ?? "Unknown"})`
          : "Unknown App";

        return (
          <Tab
            style={{ overflowY: "auto" }}
            id={id}
            key={id}
            title={tabTitle}
            panel={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                {/* Connection Info */}
                {targetInfo && (
                  <Callout
                    intent={session.connection.type === "local-process" ? "none" : "primary"}
                    style={{ margin: "10px 16px", flexShrink: 0 }}
                  >
                    <strong>Target:</strong> {targetInfo.name} ({session.connection.type})
                    {session.connection.websocketUrl && (
                      <div style={{ marginTop: 5, fontSize: "0.9em", color: "#666" }}>
                        WebSocket: {session.connection.websocketUrl}
                      </div>
                    )}
                    {session.connection.nodePort && (
                      <div style={{ marginTop: 5, fontSize: "0.9em", color: "#666" }}>
                        Node Port: {session.connection.nodePort} | Renderer Port: {session.connection.windowPort}
                      </div>
                    )}
                  </Callout>
                )}

                {/* Top: Process Table */}
                <div
                  style={{
                    height: "40%",
                    minHeight: 200,
                    overflow: "auto",
                    padding: "0 16px",
                    borderBottom: "1px solid var(--bp5-divider-black)",
                    flexShrink: 0,
                  }}
                >
                  <HTMLTable compact interactive style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Title</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(session.page).map(([id, page]) => (
                        <tr key={id}>
                          <td>
                            <Tag
                              intent={page.type === "node"
                                ? "success"
                                : page.type === "page"
                                  ? "primary"
                                  : "none"}
                            >
                              {page.type}
                            </Tag>
                          </td>
                          <td
                            style={{
                              maxWidth: 300,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {page.title}
                          </td>
                          <td>
                            <Button
                              size="small"
                              endIcon="share"
                              onClick={() => {
                                const url = page.devtoolsFrontendUrl
                                  .replace(
                                    /^\/devtools/,
                                    "devtools://devtools/bundled",
                                  )
                                  .replace(
                                    /^chrome-devtools:\/\//,
                                    "devtools://",
                                  );

                                window.debugtronAPI.openDevTools(url);
                              }}
                            >
                              Inspect
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </HTMLTable>
                </div>

                {/* Bottom: Console Output */}
                <div
                  style={{
                    flex: 1,
                    overflow: "auto",
                    padding: "10px 16px",
                    minHeight: 0,
                  }}
                >
                  <Xterm
                    content={session.log}
                    options={{
                      fontFamily: "SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace",
                      convertEol: true,
                    }}
                  />
                </div>
              </div>
            }
          />
        );
      })}
    </Tabs>
  );
};
