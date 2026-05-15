interface MembershipItem {
  name?: string;
  label?: string;
  plan?: string;
  count?: number;
  value?: number;
}

interface MembershipChartProps {
  data?: unknown;
}

export default function MembershipChart({
  data,
}: MembershipChartProps) {
  // Normalize incoming data
  const safeData: MembershipItem[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.data)
    ? (data as any).data
    : [];

  // Empty state
  if (safeData.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Membership Distribution
        </h3>
        <div className="flex h-64 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          No membership data available
        </div>
      </div>
    );
  }

  const total = safeData.reduce(
    (sum, item) =>
      sum + (item.count ?? item.value ?? 0),
    0
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
        Membership Distribution
      </h3>

      <div className="space-y-4">
        {safeData.map((item, index) => {
          const value =
            item.count ?? item.value ?? 0;

          const label =
            item.name ??
            item.label ??
            item.plan ??
            `Plan ${index + 1}`;

          const percentage =
            total > 0
              ? (value / total) * 100
              : 0;

          return (
            <div key={index}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {value}
                </span>
              </div>

              <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-800">
                <div
                  className="h-3 rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}