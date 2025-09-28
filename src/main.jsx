import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./app/App.jsx";
import "./index.css";
import { AuthProvider } from "./shared/auth.jsx";
import { initTheme } from "./shared/theme.js";
initTheme();   // <-- sets data-theme and theme-color early

ReactDOM.createRoot(document.getElementById("root")).render(
<React.StrictMode>
    <AuthProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </AuthProvider>
  </React.StrictMode>
);