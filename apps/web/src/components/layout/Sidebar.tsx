import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { sidebarConfig } from "@/config/sidebar.config";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/useSidebar";
import { getSidebarRoleKey } from "@/lib/permissions";

function getInitials(name?: string) {
  if (!name) return "GP";

  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Sidebar() {
  const { user } = useAuth();
  const { isOpen } = useSidebar();

  const roleKey = getSidebarRoleKey(user?.role);
  const items = sidebarConfig[roleKey as keyof typeof sidebarConfig] || [];

  return (
    <aside
      className={clsx(
        "relative z-40 hidden shrink-0 flex-col border-r border-(--border) bg-(--sidebar-bg) shadow-(--shadow-lg) backdrop-blur-2xl transition-all duration-300 md:flex",
        isOpen ? "w-72" : "w-20"
      )}
    >
      <div className="flex h-20 items-center border-b border-(--border) px-4">
        <div className="flex w-full items-center gap-3 rounded-2xl bg-(--surface) p-3 shadow-(--shadow-sm)">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-sm font-black text-white shadow-[0_12px_30px_rgba(79,70,229,0.35)]">
            GP
          </div>

          {isOpen && (
            <div className="min-w-0">
              <h1 className="truncate bg-[image:var(--gradient-primary)] bg-clip-text text-xl font-black tracking-tight text-transparent">
                GymPro
              </h1>
              <p className="truncate text-xs font-semibold text-(--text-muted)">
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
                  "group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all duration-200",
                  isActive
                    ? "bg-[image:var(--gradient-primary)] text-white shadow-[0_14px_34px_rgba(79,70,229,0.32)]"
                    : "text-(--text-secondary) hover:bg-(--surface-hover) hover:text-(--text-primary)",
                  !isOpen && "justify-center"
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              {isOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-(--border) p-4">
        <div
          className={clsx(
            "rounded-2xl border border-(--border) bg-(--surface) p-3 shadow-(--shadow-sm)",
            !isOpen && "flex justify-center"
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-sm font-black text-white">
              {getInitials(user?.name)}
            </div>

            {isOpen && (
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-(--text-primary)">
                  {user?.name || "Gym Owner"}
                </p>
                <p className="truncate text-xs font-semibold text-(--text-secondary)">
                  {(user?.role || "MEMBER").replace("_", " ")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

