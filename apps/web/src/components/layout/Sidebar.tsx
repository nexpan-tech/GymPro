// src/components/layout/Sidebar.tsx
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { sidebarConfig } from "@/config/sidebar.config";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/useSidebar";

export default function Sidebar() {
  const { user } = useAuth();
  const { isOpen } = useSidebar();

  const rawRole = user?.role || "ADMIN";

  const roleKey =
    rawRole === "ADMIN"
      ? "gym_admin"
      : rawRole.toLowerCase();

  const items =
    sidebarConfig[roleKey as keyof typeof sidebarConfig] || [];

  return (
    <aside
      className={clsx(
        "hidden md:flex flex-col w-72 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
        !isOpen && "md:w-20"
      )}
    >
      <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-primary">GymPro</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                )
              }
            >
              <Icon className="h-5 w-5" />
              {isOpen && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}