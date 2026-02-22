import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Prevent uncaught promise rejections from crashing the app
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    event.preventDefault();
    console.warn("Unhandled promise rejection:", event.reason);
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
