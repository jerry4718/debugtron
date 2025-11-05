import { App } from "./app";
import { store } from "./store";

import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
}
