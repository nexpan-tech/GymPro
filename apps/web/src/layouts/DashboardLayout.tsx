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
     <div className="min-h-screen bg-(image:--gradient-page) text-(--text-primary)">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            <Header title={title} />

            <main className="relative flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-370 px-4 py-6 md:px-8 lg:px-10">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}