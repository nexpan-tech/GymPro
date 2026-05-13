export function Button({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        padding: "10px 14px",
        background: "var(--text)",
        color: "var(--bg)",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}