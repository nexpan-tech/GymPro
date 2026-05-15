// src/components/layout/Header.tsx
import NotificationsDropdown from "./NotificationsDropdown";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

interface HeaderProps {
  title?: string;
}

export default function Header({
  title = "Dashboard",
}: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationsDropdown />
        <UserMenu />
      </div>
    </header>
  );
}