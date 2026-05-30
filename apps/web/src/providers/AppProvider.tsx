/**
 * AppProvider — legacy named export kept for backward compatibility.
 * New code should import AppProviders from "./AppProviders" instead.
 */
import type { PropsWithChildren } from "react";
import { AppProviders } from "./AppProviders";

export function AppProvider({ children }: PropsWithChildren) {
  return <AppProviders>{children}</AppProviders>;
}