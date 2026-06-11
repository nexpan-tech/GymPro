interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <span className="px-2 py-1 text-xs rounded bg-muted">
      {status}
    </span>
  );
}