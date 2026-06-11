import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function SectionHeader({
  title,
  description,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground dark:text-white">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}