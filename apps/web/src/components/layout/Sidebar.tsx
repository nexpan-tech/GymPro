import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { sidebarConfig } from "@/config/sidebar.config";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/useSidebar";

function getInitials(name?: string) {
  if (!name) return "GP";

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Sidebar() {
  const { user } = useAuth();
  const { isOpen } = useSidebar();

  const rawRole = user?.role || "ADMIN";
  const roleKey = rawRole === "ADMIN" ? "gym_admin" : rawRole.toLowerCase();
  const items = sidebarConfig[roleKey as keyof typeof sidebarConfig] || [];

  return (
    <aside
      className={clsx(
        "relative z-40 hidden shrink-0 flex-col border-r border-(--border) bg-(--glass) shadow-(--shadow-lg) backdrop-blur-xl transition-all duration-300 md:flex",
        isOpen ? "w-72" : "w-20"
      )}
    >
      <div className="flex h-16 items-center border-b border-(--border) px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--gradient-primary) text-sm font-black text-white shadow-[0_12px_30px_rgba(79,70,229,0.35)]">
            GP
          </div>

          {isOpen && (
            <div>
              <h1 className="bg-(--gradient-primary) bg-clip-text text-xl font-black tracking-tight text-transparent">
                GymPro
              </h1>
              <p className="text-xs font-medium text-(--text-muted)">
                Premium Gym OS
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={!isOpen ? item.label : undefined}
              className={({ isActive }) =>
                clsx(
                  "group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-(--gradient-primary) text-white shadow-[0_14px_34px_rgba(79,70,229,0.35)]"
                    : "text-(--text-secondary) hover:bg-(--surface-hover) hover:text-(--text-primary)",
                  !isOpen && "justify-center"
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              {isOpen && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-(--border) p-4">
        <div
          className={clsx(
            "rounded-2xl border border-(--border) bg-(--surface-secondary) p-3",
            !isOpen && "flex justify-center"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--gradient-primary) text-sm font-bold text-white">
              {getInitials(user?.name)}
            </div>

            {isOpen && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-(--text-primary)">
                  {user?.name || "Gym Owner"}
                </p>
                <p className="truncate text-xs text-(--text-secondary)">
                  {rawRole.replace("_", " ")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}