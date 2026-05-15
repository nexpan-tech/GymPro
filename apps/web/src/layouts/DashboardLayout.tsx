// src/layouts/DashboardLayout.tsx
import { Outlet, useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/context/SidebarContext";

function getPageTitle(pathname: string): string {
  const last = pathname.split("/").filter(Boolean).pop() || "dashboard";

  return last
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function DashboardLayout() {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header title={title} />

          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}