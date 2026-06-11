import type { ReactNode } from "react";

interface FilterBarProps {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
}

export default function FilterBar({
  search,
  filters,
  actions,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm dark:border-border dark:bg-muted md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
        {search}

        {filters && (
          <div className="flex flex-wrap items-center gap-3">
            {filters}
          </div>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}