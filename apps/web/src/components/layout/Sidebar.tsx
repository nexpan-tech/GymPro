// src/components/layout/Sidebar.tsx
// Premium fixed sidebar — role-aware, collapsible, mobile overlay
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import {
  Activity,
  BarChart3,
  Banknote,
  Bell,
  Bot,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Dumbbell,
  FileText,
  Flame,
  Funnel,
  GitBranch,
  HeartPulse,
  IdCard,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Megaphone,
  Receipt,
  Salad,
  ScrollText,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import { getNavItems, getRoleLabel, getRoleBadgeColor } from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";

// ── Icon registry ─────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  BarChart3,
  Banknote,
  Bell,
  Bot,
  Building2,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Dumbbell,
  FileText,
  Flame,
  Funnel,
  GitBranch,
  HeartPulse,
  IdCard,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Megaphone,
  Receipt,
  Salad,
  ScrollText,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  UserCheck,
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? LayoutDashboard;
}

// ── Helper ────────────────────────────────────────────────────────────────────
function getInitials(name?: string | null): string {
  if (!name) return "GP";
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const overlayRef = useRef<HTMLDivElement>(null);

  const role = user?.role ?? "MEMBER";
  const navItems = getNavItems(role);
  const roleLabel = getRoleLabel(role);
  const roleBadgeClass = getRoleBadgeColor(role);

  // Group nav items by their group field
  const groups = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    const key = item.group ?? "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // Close mobile sidebar on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        mobileOpen &&
        overlayRef.current &&
        overlayRef.current === e.target
      ) {
        onMobileClose?.();
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [mobileOpen, onMobileClose]);

  // Close mobile sidebar on Escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileOpen) onMobileClose?.();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [mobileOpen, onMobileClose]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  // ── Sidebar inner content ──────────────────────────────────────────────────
  const sidebarContent = (
    <aside
      style={{
        width: collapsed ? "var(--sidebar-collapsed-width, 72px)" : "var(--sidebar-width, 260px)",
        backgroundColor: "var(--bg-sidebar, #0f172a)",
        transition: "width var(--transition-slow, 300ms ease)",
      }}
      className="relative z-40 flex h-full shrink-0 flex-col overflow-hidden"
    >
      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div
        className="flex h-16 shrink-0 items-center justify-between border-b px-3"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          {/* Logo mark */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-lg"
            style={{ background: "var(--gradient-primary, linear-gradient(135deg,#4f46e5,#7c3aed))" }}
          >
            GP
          </div>

          {/* Brand name — hidden when collapsed */}
          {!collapsed && (
            <div className="min-w-0">
              <h1
                className="truncate text-lg font-black tracking-tight text-white"
                style={{ fontFamily: "inherit" }}
              >
                GymPro
              </h1>
              <p className="truncate text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                Premium Gym OS
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle button — desktop only */}
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden rounded-lg p-1.5 transition-colors duration-150 md:flex"
          style={{
            color: "rgba(255,255,255,0.45)",
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(255,255,255,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          }}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* ── Role badge ────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${roleBadgeClass}`}
          >
            {roleLabel}
          </span>
        </div>
      )}

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="mb-1">
            {/* Group label — only when expanded */}
            {!collapsed && (
              <p
                className="mb-1 px-3 text-[9px] font-black uppercase tracking-[0.16em]"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                {group}
              </p>
            )}

            {items.map((item) => {
              const Icon = resolveIcon(item.icon);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    [
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150",
                      collapsed ? "justify-center" : "",
                      isActive
                        ? "text-white"
                        : "hover:text-white",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          background:
                            "var(--gradient-primary, linear-gradient(135deg,#4f46e5,#7c3aed))",
                          boxShadow: "0 8px 24px rgba(79,70,229,0.35)",
                          color: "#fff",
                        }
                      : {
                          color: "rgba(255,255,255,0.6)",
                        }
                  }
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    if (!el.getAttribute("aria-current")) {
                      el.style.backgroundColor = "rgba(255,255,255,0.07)";
                      el.style.color = "#fff";
                    }
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    if (!el.getAttribute("aria-current")) {
                      el.style.backgroundColor = "";
                      el.style.color = "rgba(255,255,255,0.6)";
                    }
                  }}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />

                  {!collapsed && (
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  )}

                  {/* Badge */}
                  {!collapsed && item.badge != null && item.badge > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── User footer ───────────────────────────────────────────────────── */}
      <div
        className="shrink-0 border-t p-3"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div
          className={`flex items-center gap-3 rounded-xl p-2.5 ${collapsed ? "justify-center" : ""}`}
          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
        >
          {/* Avatar */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white"
            style={{
              background:
                "var(--gradient-primary, linear-gradient(135deg,#4f46e5,#7c3aed))",
            }}
          >
            {getInitials(user?.name)}
          </div>

          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">
                  {user?.name ?? "User"}
                </p>
                <p
                  className="truncate text-[11px]"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  {user?.email ?? ""}
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="rounded-lg p-1.5 transition-colors duration-150"
                style={{ color: "rgba(255,255,255,0.45)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "rgba(239,68,68,0.12)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "rgba(255,255,255,0.45)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "";
                }}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Collapsed logout button */}
        {collapsed && (
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className="mt-1.5 flex w-full items-center justify-center rounded-xl p-2.5 transition-colors duration-150"
            style={{ color: "rgba(255,255,255,0.45)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(239,68,68,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "rgba(255,255,255,0.45)";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "";
            }}
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <div className="hidden md:flex md:h-screen md:flex-col">{sidebarContent}</div>

      {/* ── Mobile overlay ───────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex md:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
        >
          {/* Sidebar panel slides in from left */}
          <div
            className="flex h-full flex-col"
            style={{
              width: "var(--sidebar-width, 260px)",
              backgroundColor: "var(--bg-sidebar, #0f172a)",
              animation: "slideInLeft 0.22s ease",
            }}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
