import { configureStore } from "@reduxjs/toolkit";
import { stateSyncEnhancer } from "electron-redux/renderer";

import { appSlice } from "../reducers/app";
import { sessionSlice } from "../reducers/session";
import { targetSlice } from "../reducers/target";

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    session: sessionSlice.reducer,
    target: targetSlice.reducer,
  },
  enhancers: (g) => g().concat(stateSyncEnhancer()),
});
