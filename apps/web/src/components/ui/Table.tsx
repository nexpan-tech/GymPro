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
        "overflow-hidden rounded-2xl border border-border bg-white shadow-sm",
        "dark:border-border dark:bg-muted",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted dark:bg-muted">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left font-semibold text-muted-foreground"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border dark:divide-border">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}