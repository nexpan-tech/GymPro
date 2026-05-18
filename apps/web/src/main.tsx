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

import { ThemeProvider } from "@/context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);