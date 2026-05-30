import { type ReactNode, useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { SkeletonTable } from "./Skeleton";
import EmptyState from "./EmptyState";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: keyof T | string;
  header: string;
  /** Optional custom cell renderer */
  render?: (value: unknown, row: T) => ReactNode;
  sortable?: boolean;
  /** Min column width, e.g. "min-w-[120px]" */
  minWidth?: string;
  /** Alignment */
  align?: "left" | "center" | "right";
}

type SortDirection = "asc" | "desc";

interface SortState {
  key: string;
  direction: SortDirection;
}

interface DataTableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  /** Row key extractor — defaults to row index */
  rowKey?: (row: T, index: number) => string | number;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  /** Number of skeleton rows shown when loading */
  skeletonRows?: number;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNestedValue<T extends object>(obj: T, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

const alignClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DataTable<T extends object>({
  columns,
  data,
  loading = false,
  rowKey,
  emptyState,
  onRowClick,
  skeletonRows = 6,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);

  // ── Sorting ──────────────────────────────────────────────────────────────

  function handleSort(key: string) {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc"
          ? { key, direction: "desc" }
          : null; // third click clears sort
      }
      return { key, direction: "asc" };
    });
  }

  const sortedData = sort
    ? [...data].sort((a, b) => {
        const aVal = getNestedValue(a, sort.key);
        const bVal = getNestedValue(b, sort.key);

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison =
          typeof aVal === "string" && typeof bVal === "string"
            ? aVal.localeCompare(bVal)
            : (aVal as number) < (bVal as number)
            ? -1
            : 1;

        return sort.direction === "asc" ? comparison : -comparison;
      })
    : data;

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return <SkeletonTable rows={skeletonRows} cols={columns.length} className={className} />;
  }

  // ── Sort icon helper ─────────────────────────────────────────────────────

  function SortIcon({ colKey }: { colKey: string }) {
    if (!sort || sort.key !== colKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />;
    }
    return sort.direction === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[22px] border border-(--border)",
        "bg-(--glass-strong) shadow-(--shadow-md) backdrop-blur-xl",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          {/* Head */}
          <thead>
            <tr className="border-b border-(--border) bg-(--surface-secondary)">
              {columns.map((col) => {
                const key = String(col.key);
                const isSorted = sort?.key === key;

                return (
                  <th
                    key={key}
                    scope="col"
                    className={cn(
                      "px-4 py-3 font-semibold text-(--text-secondary)",
                      alignClasses[col.align ?? "left"],
                      col.minWidth,
                      col.sortable &&
                        "cursor-pointer select-none hover:text-(--text-primary) transition-colors"
                    )}
                    onClick={col.sortable ? () => handleSort(key) : undefined}
                    aria-sort={
                      isSorted
                        ? sort!.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : col.sortable
                        ? "none"
                        : undefined
                    }
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.header}
                      {col.sortable && <SortIcon colKey={key} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-(--border)">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  {emptyState ?? (
                    <EmptyState
                      title="No data found"
                      description="There are no records to display yet."
                      size="md"
                    />
                  )}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIdx) => (
                <tr
                  key={rowKey ? rowKey(row, rowIdx) : rowIdx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "transition-colors duration-150",
                    "hover:bg-(--surface-hover)",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => {
                    const key = String(col.key);
                    const rawValue = getNestedValue(row, key);
                    const cell = col.render
                      ? col.render(rawValue, row)
                      : (rawValue as ReactNode);

                    return (
                      <td
                        key={key}
                        className={cn(
                          "px-4 py-3.5 text-(--text-primary)",
                          alignClasses[col.align ?? "left"],
                          col.minWidth
                        )}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
