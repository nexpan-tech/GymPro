import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({
  title = "No data found",
  description = "There is nothing to display right now.",
  message,
  icon,
  action,
}: EmptyStateProps) {
  const descriptionText = message ?? description;

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-white px-6 py-16 text-center shadow-sm dark:border-border dark:bg-muted">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>

      <h3 className="text-lg font-semibold text-foreground dark:text-white">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {descriptionText}
      </p>

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}