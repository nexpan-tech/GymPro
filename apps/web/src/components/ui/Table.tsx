// src/components/ui/Table.tsx
import { ReactNode } from "react";
import clsx from "clsx";

interface TableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
}

export default function Table({
  headers,
  children,
  className,
}: TableProps) {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm",
        "dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}