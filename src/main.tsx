import React from "react";
import { createRoot } from "react-dom/client";

// Debug: Log React version to verify single instance
console.log('[AURRA] React version:', React.version);
console.log('[AURRA] React instance check:', { 
  hasUseState: typeof React.useState === 'function',
  hasUseEffect: typeof React.useEffect === 'function'
});

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
