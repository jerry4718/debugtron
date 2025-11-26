import { configureStore } from "@reduxjs/toolkit";
import { stateSyncEnhancer } from "electron-redux/renderer";

import { targetSlice } from "../reducers/target";
import { sessionSlice } from "../reducers/session";

export const store = configureStore({
  reducer: {
    target: targetSlice.reducer,
    session: sessionSlice.reducer,
  },
  enhancers: (g) => g().concat(stateSyncEnhancer()),
});
