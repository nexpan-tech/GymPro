// src/components/layout/UserMenu.tsx
import { LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <span className="hidden md:block text-sm font-medium">
          {user?.name || "User"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 z-50">
          <a
            href="/profile"
            className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <User className="h-4 w-4" />
            Profile
          </a>

          <button
            onClick={logout}
            className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}