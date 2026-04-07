import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // <-- ESTA LINHA É ESSENCIAL
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AlertProvider } from "./contexts/AlertContext";
import { ModalProvider } from "./contexts/ModalContext";
import { startApiLogger } from "./lib/apiLogger";

// Activo apenas em desenvolvimento
if (import.meta.env.DEV) {
  startApiLogger();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <HashRouter>
    <AlertProvider>
      <AuthProvider>
        <ModalProvider>
          <App />
        </ModalProvider>
      </AuthProvider>
    </AlertProvider>
  </HashRouter>
  // </React.StrictMode>
);
