import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('Failed to fetch dynamically imported module')) {
    console.warn('Chunk load error detected, reloading page to fetch new chunks...');
    window.location.reload();
  }
});
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.message && e.reason.message.includes('Failed to fetch dynamically imported module')) {
    console.warn('Chunk load error detected (promise), reloading page to fetch new chunks...');
    window.location.reload();
  }
});

import { CssBaseline } from "@mui/material";
import "./styles/tailwind.css";
import App from "./router/App";
import { ToastProvider } from "./components/Toast";
import { ThemeContextProvider } from "./theme/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeContextProvider>
      <CssBaseline />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </ThemeContextProvider>
  </React.StrictMode>,
);

