export function Grid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}