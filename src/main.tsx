import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // <-- ESTA LINHA É ESSENCIAL
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AlertProvider } from "./contexts/AlertContext";
import { ModalProvider } from "./contexts/ModalContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <AlertProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </AlertProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
