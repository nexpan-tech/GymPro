import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// ─── Base Skeleton ─────────────────────────────────────────────────────────────

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Explicit width override, e.g. "w-32" */
  width?: string;
  /** Explicit height override, e.g. "h-4" */
  height?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}

const roundedClasses = {
  sm: "rounded",
  md: "rounded-lg",
  lg: "rounded-xl",
  full: "rounded-full",
};

export function Skeleton({
  width,
  height,
  rounded = "md",
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-(--surface-hover)",
        roundedClasses[rounded],
        width,
        height,
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

// ─── SkeletonText ─────────────────────────────────────────────────────────────

interface SkeletonTextProps {
  lines?: number;
  /** Last line width, e.g. "w-2/3" */
  lastLineWidth?: string;
  className?: string;
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = "w-2/3",
  className,
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="h-4"
          width={i === lines - 1 ? lastLineWidth : "w-full"}
        />
      ))}
    </div>
  );
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

interface SkeletonCardProps {
  showAvatar?: boolean;
  lines?: number;
  className?: string;
}

export function SkeletonCard({
  showAvatar = false,
  lines = 3,
  className,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-border bg-(--glass-strong) p-6 shadow-(--shadow-md)",
        className
      )}
      aria-hidden="true"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        {showAvatar && (
          <Skeleton width="w-10" height="h-10" rounded="full" />
        )}
        <div className="flex-1 space-y-2">
          <Skeleton height="h-4" width="w-1/3" />
          <Skeleton height="h-3" width="w-1/2" />
        </div>
      </div>

      {/* Body */}
      <div className="mt-4">
        <SkeletonText lines={lines} />
      </div>
    </div>
  );
}

// ─── SkeletonTable ────────────────────────────────────────────────────────────

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  cols = 5,
  className,
}: SkeletonTableProps) {
  const colWidths = ["w-1/4", "w-1/5", "w-1/6", "w-1/5", "w-1/8"];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[22px] border border-border bg-(--glass-strong) shadow-(--shadow-md)",
        className
      )}
      aria-hidden="true"
      aria-label="Loading table data"
    >
      {/* Header */}
      <div className="flex gap-4 border-b border-border bg-(--surface-secondary) px-6 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton
            key={i}
            height="h-3"
            width={colWidths[i % colWidths.length]}
          />
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-4 px-6 py-4">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                height="h-4"
                width={colWidths[colIdx % colWidths.length]}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SkeletonKpi ──────────────────────────────────────────────────────────────

interface SkeletonKpiProps {
  className?: string;
}

export function SkeletonKpi({ className }: SkeletonKpiProps) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-border bg-(--glass-strong) p-6 shadow-(--shadow-md)",
        className
      )}
      aria-hidden="true"
      aria-label="Loading metric"
    >
      {/* Title + icon row */}
      <div className="flex items-start justify-between">
        <Skeleton height="h-4" width="w-28" />
        <Skeleton height="h-10" width="w-10" rounded="lg" />
      </div>

      {/* Value */}
      <Skeleton height="h-9" width="w-32" className="mt-3" />

      {/* Change badge */}
      <div className="mt-3 flex items-center gap-2">
        <Skeleton height="h-5" width="w-16" rounded="full" />
        <Skeleton height="h-3" width="w-20" />
      </div>
    </div>
  );
}
