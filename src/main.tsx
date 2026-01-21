// CRITICAL: Import React first before any other modules
import * as React from "react";
import * as ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";

// Ensure React is available globally to prevent multiple instance issues
if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOM;
}

import App from "./App.tsx";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
