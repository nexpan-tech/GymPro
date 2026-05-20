import { Menu } from "lucide-react";
import NotificationsDropdown from "./NotificationsDropdown";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import { useSidebar } from "@/hooks/useSidebar";

interface HeaderProps {
  title?: string;
}

export default function Header({ title = "Dashboard" }: HeaderProps) {
  const { toggle } = useSidebar();

  return (
    <header className="relative z-50 flex h-20 shrink-0 items-center justify-between border-b border-(--border) bg-(--header-bg) px-4 shadow-(--shadow-sm) backdrop-blur-2xl md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="rounded-2xl border border-(--border) bg-(--surface) p-2.5 text-(--text-secondary) shadow-(--shadow-sm) transition hover:bg-(--surface-hover) hover:text-(--text-primary)"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-(--text-muted)">
            GymPro
          </p>
          <h1 className="text-xl font-black tracking-tight text-(--text-primary)">
            {title}
          </h1>
        </div>
      </div>

      <div className="relative z-9999 flex items-center gap-3">
        <ThemeToggle />
        <NotificationsDropdown />
        <UserMenu />
      </div>
    </header>
  );
}

