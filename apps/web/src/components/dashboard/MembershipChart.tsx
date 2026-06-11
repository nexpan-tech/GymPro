interface MembershipItem {
  name?: string;
  label?: string;
  plan?: string;
  count?: number;
  value?: number;
}

interface MembershipChartProps {
  data?: MembershipItem[] | { data?: MembershipItem[] };
}

export default function MembershipChart({
  data,
}: MembershipChartProps) {
  const safeData: MembershipItem[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data ?? []
    : [];

  // Empty state
  if (safeData.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-border dark:bg-muted">
        <h3 className="mb-4 text-lg font-semibold text-foreground dark:text-white">
          Membership Distribution
        </h3>
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
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
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-border dark:bg-muted">
      <h3 className="mb-6 text-lg font-semibold text-foreground dark:text-white">
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
                <span className="font-medium text-foreground dark:text-muted-foreground">
                  {label}
                </span>
                <span className="text-muted-foreground">
                  {value}
                </span>
              </div>

              <div className="h-3 w-full rounded-full bg-muted dark:bg-muted">
                <div
                  className="h-3 rounded-full bg-muted-foreground transition-all"
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