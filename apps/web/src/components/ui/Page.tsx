// src/components/ui/Page.tsx
import { ReactNode } from "react";
import clsx from "clsx";

interface PageProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Page({
  title,
  description,
  action,
  children,
  className,
}: PageProps) {
  return (
    <div className={clsx("space-y-6", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div>{children}</div>
    </div>
  );
}