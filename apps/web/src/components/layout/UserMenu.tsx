import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";

function getInitials(name?: string) {
  if (!name) return "U";

  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleLogout() {
    setOpen(false);
    logout();
  }

  return (
    <div ref={wrapperRef} className="relative z-9999">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={clsx(
          "flex items-center gap-2 rounded-2xl border border-(--border) bg-(--surface) px-2 py-1.5 shadow-(--shadow-sm) transition-all duration-200",
          "hover:bg-(--surface-hover) hover:shadow-(--shadow-md)"
        )}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-sm font-black text-white shadow-[0_10px_24px_rgba(79,70,229,0.28)]">
          {getInitials(user?.name)}
        </div>

        <div className="hidden min-w-0 text-left md:block">
          <p className="max-w-32 truncate text-sm font-bold text-(--text-primary)">
            {user?.name || "User"}
          </p>
          <p className="text-xs font-medium text-(--text-muted)">
            {user?.role || "Member"}
          </p>
        </div>

        <ChevronDown
          className={clsx(
            "hidden h-4 w-4 text-(--text-muted) transition-transform md:block",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-9999 mt-3 w-64 overflow-hidden rounded-2xl border border-(--glass-border) bg-(--glass) shadow-(--shadow-xl) backdrop-blur-xl">
          <div className="border-b border-(--border) px-4 py-4">
            <p className="text-sm font-black text-(--text-primary)">
              {user?.name || "User"}
            </p>
            <p className="mt-0.5 truncate text-xs text-(--text-secondary)">
              {user?.email || "user@gympro.com"}
            </p>
          </div>

          <div className="p-2">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-(--text-secondary) transition hover:bg-(--surface-hover) hover:text-(--text-primary)"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>

            <Link
              to={
                user?.role === "SUPER_ADMIN"
                  ? "/super-admin/settings"
                  : "/gym-admin/settings"
              }
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-(--text-secondary) transition hover:bg-(--surface-hover) hover:text-(--text-primary)"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-500 transition hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


