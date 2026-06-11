import type { ReactNode } from "react";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  rowKey?: (row: T, index: number) => string;
}

export default function DataTable<T>({
  data,
  columns,
  isLoading = false,
  emptyTitle = "No data found",
  emptyDescription = "There is nothing to display.",
  rowKey,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-white p-10 shadow-sm dark:border-border dark:bg-muted">
        <LoadingSpinner text="Loading data..." />
      </div>
    );
  }

  if (!data.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm dark:border-border dark:bg-muted">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-border bg-muted dark:border-border dark:bg-muted">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border dark:divide-border">
            {data.map((row, index) => (
              <tr
                key={rowKey ? rowKey(row, index) : index}
                className="transition-colors hover:bg-muted dark:hover:bg-muted"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 text-sm text-foreground dark:text-muted-foreground ${column.className ?? ""}`}
                  >
                    {column.render
                      ? column.render(row)
                      : String(
                          (row as Record<string, unknown>)[column.key] ?? ""
                        )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}