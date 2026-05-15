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
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}