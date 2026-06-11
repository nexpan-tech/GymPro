import { Moon, Sun, Monitor } from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ] as const;

  return (
    <div className="flex items-center rounded-2xl border border-border bg-(--surface) p-1 shadow-(--shadow-sm) backdrop-blur-xl">
      {options.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            title={option.label}
            className={clsx(
              "rounded-xl p-2 transition-all duration-200",
              active
                ? "bg-(image:--gradient-primary) text-white shadow-[0_8px_20px_rgba(231,55,37,0.28)]"
                : "text-(--text-secondary) hover:bg-(--surface-hover) hover:text-(--text-primary)"
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

