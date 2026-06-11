// src/components/layout/TopBar.tsx
// Fixed top bar — 64px height, breadcrumb, notifications, user menu
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  User,
} from "lucide-react";

import type { User as UserType } from "@/types/auth.types";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationStore } from "@/store/notification.store";
import NotificationPanel from "./NotificationPanel";
import ThemeToggle from "./ThemeToggle";


// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name?: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getSettingsPath(role?: string | null): string {
  if (role === "SUPER_ADMIN") return "/super-admin/settings";
  if (role === "TRAINER") return "/trainer/settings";
  if (role === "MEMBER") return "/member/settings";
  return "/gym-admin/settings";
}


// ── User dropdown ─────────────────────────────────────────────────────────────
function UserDropdown({
  user,
  onClose,
  onLogout,
}: {
  user: UserType | null;
  onClose: () => void;
  onLogout: () => void;
}) {
  const settingsPath = getSettingsPath(user?.role);

  const menuItems = [
    { label: "Profile",  icon: User,     path: "/profile" },
    { label: "Settings", icon: Settings, path: settingsPath },
  ] as const;

  return (
    <div
      className="absolute right-0 top-full z-9999 mt-3 w-64 overflow-hidden rounded-2xl border shadow-xl backdrop-blur-xl"
      style={{
        background: "var(--glass, rgba(255,255,255,0.94))",
        borderColor: "var(--border, rgba(1,0,0,0.10))",
        boxShadow: "var(--shadow-xl, 0 32px 90px rgba(1,0,0,0.14))",
      }}
    >
      {/* Identity */}
      <div
        className="border-b px-4 py-4"
        style={{ borderColor: "var(--border, rgba(1,0,0,0.10))" }}
      >
        <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
          {user?.name ?? "User"}
        </p>
        <p
          className="mt-0.5 truncate text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          {user?.email ?? ""}
        </p>
      </div>

      {/* Links */}
      <div className="p-2">
        {menuItems.map(({ label, icon: Icon, path }) => (
          <Link
            key={path}
            to={path}
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                "var(--surface-hover, #f4f4f4)";
              (e.currentTarget as HTMLAnchorElement).style.color =
                "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "";
              (e.currentTarget as HTMLAnchorElement).style.color =
                "var(--text-secondary)";
            }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        {/* Divider */}
        <div
          className="my-1 h-px"
          style={{ backgroundColor: "var(--border, rgba(1,0,0,0.10))" }}
        />

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-primary transition-colors"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(231,55,37,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "";
          }}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

// ── TopBar props ──────────────────────────────────────────────────────────────
interface TopBarProps {
  onMenuToggle: () => void;
  title?: string;
  user?: UserType | null;
}

// ── TopBar component ──────────────────────────────────────────────────────────
export default function TopBar({ onMenuToggle, title = "Dashboard", user: userProp }: TopBarProps) {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  // Prefer explicitly passed user; fall back to auth context
  const user = userProp ?? authUser;

  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Live unread count from the notification store (populated by API + socket)
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  function handleLogout() {
    setUserMenuOpen(false);
    logout();
    navigate("/login");
  }

  const roleLabel = user?.role?.replace(/_/g, " ") ?? "Member";

  return (
    <header
      className="relative z-50 flex h-16 shrink-0 items-center justify-between border-b px-4 backdrop-blur-xl md:px-6"
      style={{
        height: "var(--topbar-height, 64px)",
        background: "var(--header-bg, rgba(255,255,255,0.78))",
        borderColor: "var(--border, rgba(1,0,0,0.10))",
        boxShadow: "var(--shadow-sm, 0 1px 3px rgba(1,0,0,0.04))",
      }}
    >
      {/* Hairline red energy accent along the bottom edge — control-bar feel. */}
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(231,55,37,0.45), transparent)" }}
        aria-hidden="true"
      />

      {/* ── Left: hamburger + page title ─────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Hamburger (mobile) */}
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          className="rounded-xl border p-2 transition-colors md:hidden"
          style={{
            borderColor: "var(--border, rgba(1,0,0,0.10))",
            background: "var(--surface, rgba(255,255,255,0.96))",
            color: "var(--text-secondary)",
          }}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
          className="hidden rounded-xl border p-2 transition-colors md:flex"
          style={{
            borderColor: "var(--border, rgba(1,0,0,0.10))",
            background: "var(--surface, rgba(255,255,255,0.96))",
            color: "var(--text-secondary)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "var(--surface-hover, #f4f4f4)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "var(--surface, rgba(255,255,255,0.96))";
          }}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page title block — bold title + role eyebrow */}
        <div className="min-w-0 leading-tight">
          <p
            className="hidden text-[10px] font-extrabold uppercase tracking-[0.18em] sm:block"
            style={{ color: "var(--text-muted)" }}
          >
            {roleLabel}
          </p>
          <h1
            className="truncate text-base font-black tracking-tight md:text-lg"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h1>
        </div>
      </div>

      {/* ── Right: theme toggle, notifications, user menu ─────────────────── */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notification bell */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setUserMenuOpen(false);
            }}
            aria-label="Notifications"
            className="relative rounded-xl border p-2.5 transition-all"
            style={{
              borderColor: "var(--border, rgba(1,0,0,0.10))",
              background: "var(--surface, rgba(255,255,255,0.96))",
              color: "var(--text-secondary)",
              boxShadow: "var(--shadow-sm)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--surface-hover, #f4f4f4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--surface, rgba(255,255,255,0.96))";
            }}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-white shadow">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Slide-in panel is rendered via a portal-like fixed overlay — see below */}
        </div>

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-all"
            style={{
              borderColor: "var(--border, rgba(1,0,0,0.10))",
              background: "var(--surface, rgba(255,255,255,0.96))",
              boxShadow: "var(--shadow-sm)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--surface-hover, #f4f4f4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--surface, rgba(255,255,255,0.96))";
            }}
          >
            {/* Avatar */}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-white"
              style={{
                background:
                  "var(--gradient-primary, linear-gradient(135deg,#e73725,#e73725))",
                boxShadow: "0 6px 16px rgba(231,55,37,0.28)",
              }}
            >
              {getInitials(user?.name)}
            </div>

            <div className="hidden text-left md:block">
              <p
                className="max-w-28 truncate text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.name ?? "User"}
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {user?.role?.replace(/_/g, " ") ?? "Member"}
              </p>
            </div>

            <ChevronDown
              className={`hidden h-4 w-4 transition-transform duration-200 md:block ${userMenuOpen ? "rotate-180" : ""}`}
              style={{ color: "var(--text-muted)" }}
            />
          </button>

          {userMenuOpen && (
            <UserDropdown
              user={user}
              onClose={() => setUserMenuOpen(false)}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>

      {/* Realtime slide-in notification panel (fixed, full-height) */}
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </header>
  );
}
