export default function Page({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 26, marginBottom: 20 }}>{title}</h1>
      {children}
    </div>
  );
}