import * as Tabs from "@radix-ui/react-tabs";
import { type FC, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { targetSlice } from "../reducers/target";
import { sessionSlice } from "../reducers/session";
import { cn } from "./lib/utils";

import { Xterm } from "./xterm";

export const Session: FC = () => {
  const [activeId, setActiveId] = useState("");
  const targetStore = useSelector(targetSlice.selectSlice);
  const sessionStore = useSelector(sessionSlice.selectSlice);

  useEffect(() => {
    const sessionIds = Object.keys(sessionStore);

    // Ensure there always be one tab active
    if (!sessionIds.includes(activeId) && sessionIds[0]) {
      setActiveId(sessionIds[0]);
    }
  }, [activeId, sessionStore]);

  return (
    <Tabs.Root value={activeId} onValueChange={setActiveId} className="flex flex-col h-full">
      <Tabs.List className="flex border-b border-border bg-background px-2 gap-1 shrink-0">
        {Object.entries(sessionStore).map(([id, session]) => {
          const target = targetStore[session.targetId];
          const appInfo = target?.apps[session.appId];

          const tabTitle = appInfo
            ? `${appInfo.name} (${target.name})`
            : "Unknown App";

          return (
            <Tabs.Trigger
              key={id}
              value={id}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors border-b-2 border-transparent",
                "data-[state=active]:border-primary data-[state=active]:text-foreground",
                "data-[state=inactive]:text-muted-foreground hover:text-foreground",
              )}
            >
              {tabTitle}
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>

      {Object.entries(sessionStore).map(([id, session]) => {
        const target = targetStore[session.targetId];

        return (
          <Tabs.Content
            key={id}
            value={id}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Connection Info */}
            {target && (
              <div
                className={cn(
                  "mx-4 mt-2.5 mb-2 p-3 rounded border",
                  session.connection.type === "local-process"
                    ? "bg-muted border-border"
                    : "bg-primary/10 border-primary/30",
                )}
              >
                <div className="font-semibold text-sm">
                  Target: {target.name} ({session.connection.type})
                </div>
                {session.connection.websocketUrl && (
                  <div className="mt-1 text-xs text-muted-foreground font-mono">
                    WebSocket: {session.connection.websocketUrl}
                  </div>
                )}
                {session.connection.nodePort && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Node Port: {session.connection.nodePort} | Renderer Port: {session.connection.windowPort}
                  </div>
                )}
              </div>
            )}

            {/* Top: Process Table */}
            <div className="h-[40%] min-h-[200px] overflow-auto px-4 border-b border-border shrink-0">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b border-border">
                  <tr>
                    <th className="text-left py-2 font-medium">Type</th>
                    <th className="text-left py-2 font-medium">Title</th>
                    <th className="text-left py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(session.page).map(([pageId, page]) => (
                    <tr key={pageId} className="border-b border-border hover:bg-accent/50">
                      <td className="py-2">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded text-xs font-medium",
                            page.type === "node"
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : page.type === "page"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "bg-gray-500/10 text-gray-600 dark:text-gray-400",
                          )}
                        >
                          {page.type}
                        </span>
                      </td>
                      <td className="py-2 max-w-[300px] truncate">
                        {page.title}
                      </td>
                      <td className="py-2">
                        <button
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
                          className="px-3 py-1.5 text-xs font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded transition-colors flex items-center gap-1.5"
                        >
                          Inspect
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M3 3h6M3 6h6M3 9h4"
                              stroke="currentColor"
                              strokeWidth="1"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom: Console Output */}
            <div className="flex-1 overflow-auto p-2.5 min-h-0">
              <Xterm
                content={session.log}
                options={{
                  fontFamily: "SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace",
                  convertEol: true,
                }}
              />
            </div>
          </Tabs.Content>
        );
      })}
    </Tabs.Root>
  );
};
