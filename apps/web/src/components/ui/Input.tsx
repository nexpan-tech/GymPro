export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        padding: 10,
        borderRadius: 8,
        border: "1px solid var(--border)",
        width: "100%",
        marginBottom: 10,
        outline: "none",
        background: "var(--card)",
        color: "var(--text)",
      }}
    />
  );
}