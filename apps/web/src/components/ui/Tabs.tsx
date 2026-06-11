// src/components/ui/Tabs.tsx
import clsx from "clsx";

export interface TabItem {
  label: string;
  value: string;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
}

export default function Tabs({
  tabs,
  value,
  onChange,
}: TabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={clsx(
            "rounded-lg px-4 py-2 text-sm font-medium transition",
            value === tab.value
              ? "bg-primary text-white"
              : "bg-muted text-foreground hover:bg-muted dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}