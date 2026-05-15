// src/components/ui/Card.tsx
import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: CardProps) {
  return (
    <div
      className={clsx(
        "border-b border-gray-200 px-6 py-4 dark:border-gray-800",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
}: CardProps) {
  return (
    <div className={clsx("p-6", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: CardProps) {
  return (
    <h3
      className={clsx(
        "text-lg font-semibold",
        className
      )}
    >
      {children}
    </h3>
  );
}