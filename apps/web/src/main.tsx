import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";

import "@/styles/tailwind.css";
import "@/styles/variables.css";
import "@/styles/globals.css";

// AppProviders wraps the tree with ErrorBoundary, QueryClient, Theme,
// Auth, and ToastContainer — all in one place.
import { AppProviders } from "@/providers/AppProviders";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);