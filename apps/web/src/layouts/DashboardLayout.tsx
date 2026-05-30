// src/layouts/DashboardLayout.tsx
// Full-page dashboard layout: fixed sidebar + top bar + scrollable content
import { useState, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { useAuth } from "@/hooks/useAuth";

// ── Derive a readable page title from the current URL path ───────────────────
function getPageTitle(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean).pop() ?? "dashboard";
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const location = useLocation();
  const { user } = useAuth();

  // Desktop: collapsed/expanded state
  const [collapsed, setCollapsed] = useState(false);
  // Mobile: overlay open/close state
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggle = useCallback(() => {
    // On desktop toggle collapsed; on mobile toggle overlay
    if (window.innerWidth < 768) {
      setMobileOpen((v) => !v);
    } else {
      setCollapsed((v) => !v);
    }
  }, []);

  const handleMobileClose = useCallback(() => setMobileOpen(false), []);

  const title = getPageTitle(location.pathname);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "var(--bg-page, #f8fafc)" }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />

      {/* ── Main column ─────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          onMenuToggle={handleToggle}
          title={title}
          user={user}
        />

        {/* Scrollable content area */}
        <main
          className="relative flex-1 overflow-y-auto"
          style={{ backgroundColor: "var(--bg-page, #f8fafc)" }}
        >
          <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 md:px-8 lg:px-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
