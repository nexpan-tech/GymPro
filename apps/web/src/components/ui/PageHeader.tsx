import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      {/* Left: breadcrumbs + title */}
      <div className="min-w-0 flex-1">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex flex-wrap items-center gap-1">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <li key={idx} className="flex items-center gap-1">
                    {idx > 0 && (
                      <ChevronRight
                        className="h-3.5 w-3.5 shrink-0 text-(--text-muted)"
                        aria-hidden="true"
                      />
                    )}
                    {crumb.href && !isLast ? (
                      <a
                        href={crumb.href}
                        className={cn(
                          "text-sm font-medium transition-colors",
                          "text-(--text-secondary) hover:text-(--text-primary)"
                        )}
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isLast
                            ? "text-(--text-primary)"
                            : "text-(--text-secondary)"
                        )}
                        aria-current={isLast ? "page" : undefined}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        {/* Title */}
        <h1 className="truncate text-2xl font-black tracking-tight text-(--text-primary) sm:text-3xl">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="mt-1 text-sm text-(--text-secondary)">{subtitle}</p>
        )}
      </div>

      {/* Right: action buttons */}
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
