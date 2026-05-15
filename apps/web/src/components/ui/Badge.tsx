// src/components/ui/Badge.tsx
import { ReactNode } from "react";
import clsx from "clsx";

interface BadgeProps {
  children: ReactNode;
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info";
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        {
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300":
            variant === "default",
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400":
            variant === "success",
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400":
            variant === "warning",
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400":
            variant === "danger",
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400":
            variant === "info",
        },
        className
      )}
    >
      {children}
    </span>
  );
}