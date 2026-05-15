import type { PropsWithChildren } from "react";
import { ThemeProvider as ThemeContextProvider } from "@/context/ThemeContext";

export function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeContextProvider>
      {children}
    </ThemeContextProvider>
  );
}