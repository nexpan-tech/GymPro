import type { ReactNode } from "react";

interface AttendanceItem {
  day?: string;
  date?: string;
  attendance?: number;
  present?: number;
  value?: number;
}

interface AttendanceChartProps {
  data?: unknown;
}

export default function AttendanceChart({
  data,
}: AttendanceChartProps) {
  // Normalize incoming data
  const safeData: AttendanceItem[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.data)
    ? (data as any).data
    : [];

  // Empty state
  if (safeData.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Attendance Overview
        </h3>
        <div className="flex h-64 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          No attendance data available
        </div>
      </div>
    );
  }

  const values = safeData.map(
    (item) =>
      item.attendance ??
      item.present ??
      item.value ??
      0
  );

  const maxValue = Math.max(...values, 1);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
        Attendance Overview
      </h3>

      <div className="flex h-64 items-end gap-3">
        {safeData.map((item, index): ReactNode => {
          const value =
            item.attendance ??
            item.present ??
            item.value ??
            0;

          const label =
            item.day ??
            item.date ??
            `Day ${index + 1}`;

          const height = `${(value / maxValue) * 100}%`;

          return (
            <div
              key={index}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {value}
              </div>

              <div className="flex h-48 w-full items-end">
                <div
                  className="w-full rounded-t-lg bg-blue-500 transition-all"
                  style={{
                    height,
                    minHeight: "4px",
                  }}
                />
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}