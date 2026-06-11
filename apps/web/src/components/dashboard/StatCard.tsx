interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-muted">
      <p className="text-sm text-muted-foreground">{title}</p>
      <h3 className="mt-2 text-3xl font-bold">{value}</h3>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}