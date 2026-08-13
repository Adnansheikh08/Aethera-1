import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import { App } from "./App.jsx";
import "./styles/style.css";
import "./styles/modal.css";
import "./styles/admin.css";

/**
 * Entry point, replacing static/js/main.js.
 *
 * The vanilla version gated every enhancement behind a `.js-enabled` class so
 * no-JS visitors still got a working page. That gate is meaningless in an SPA —
 * nothing renders without JS at all — but the class is still set because the
 * ported stylesheet keys several rules off it.
 */
document.documentElement.classList.add("js-enabled");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      {/* Opt into the v7 behaviours now: startTransition changes how navigation
          state updates batch, and relativeSplatPath changes link resolution
          inside splat routes — /admin/* is one, so the console's relative links
          depend on it. Adopting them here keeps the upgrade from moving. */}
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
