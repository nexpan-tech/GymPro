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
      <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm dark:border-gray-800 dark:bg-gray-900">
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
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {data.map((row, index) => (
              <tr
                key={rowKey ? rowKey(row, index) : index}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 text-sm text-gray-700 dark:text-gray-300 ${column.className ?? ""}`}
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