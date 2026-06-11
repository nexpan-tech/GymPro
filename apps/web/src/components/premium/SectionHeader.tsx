// SectionHeader — consistent section title with a red energy tick, optional
// eyebrow + description, and a right-aligned action slot. Replaces the ad-hoc
// uppercase <h2> patterns scattered across pages.
import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionHeaderProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function SectionHeader({
  title,
  eyebrow,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="eyebrow mb-1.5 flex items-center gap-2">
            <span className="section-tick" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h2 className="flex items-center gap-2.5 text-lg font-black tracking-tight text-(--text-primary)">
          {!eyebrow && <span className="section-tick" aria-hidden="true" />}
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-(--text-secondary)">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
