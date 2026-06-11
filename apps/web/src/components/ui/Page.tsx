// src/components/ui/Page.tsx
import { ReactNode } from "react";
import clsx from "clsx";

interface PageProps {
  title: string;
  description?: string;
  /** Optional small uppercase line above the title (section context). */
  eyebrow?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Page({
  title,
  description,
  eyebrow,
  action,
  children,
  className,
}: PageProps) {
  return (
    <div className={clsx("space-y-6", className)}>
      <header className="reveal-fade flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="eyebrow mb-1.5 flex items-center gap-2">
              <span className="section-tick" aria-hidden="true" />
              {eyebrow}
            </p>
          )}
          {/* Title with the GymPro red energy tick — the "fitness OS" signature. */}
          <div className="flex items-center gap-3">
            <span
              className="h-7 w-1.5 shrink-0 rounded-full bg-(image:--gradient-primary)"
              style={{ boxShadow: "0 0 14px rgba(231,55,37,0.4)" }}
              aria-hidden="true"
            />
            <h1 className="truncate text-2xl font-black tracking-tight text-(--text-primary) sm:text-3xl">
              {title}
            </h1>
          </div>
          {description && (
            <p className="mt-1.5 pl-4.5 text-sm text-(--text-secondary)">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>
        )}
      </header>

      <div>{children}</div>
    </div>
  );
}