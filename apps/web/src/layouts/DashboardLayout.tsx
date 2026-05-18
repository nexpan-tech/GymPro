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
      <div className="flex h-screen overflow-hidden bg-(--background) text-(--text-primary)">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header title={title} />

          <main className="relative z-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_30%)]" />
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}