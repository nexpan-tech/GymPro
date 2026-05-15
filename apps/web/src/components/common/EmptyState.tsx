export default function EmptyState({ message = "No data found" }) {
  return (
    <div className="text-center p-6 opacity-70">
      {message}
    </div>
  );
}