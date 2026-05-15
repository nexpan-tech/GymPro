export default function StatusBadge({ status }: any) {
  return (
    <span className="px-2 py-1 text-xs rounded bg-gray-200">
      {status}
    </span>
  );
}