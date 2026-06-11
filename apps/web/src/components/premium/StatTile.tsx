// StatTile — compact premium stat for dense grids (sub-page summaries). Lighter
// than MetricCard but still energetic: icon tile, scoreboard number, optional
// delta/hint, energy accent on hover. Strict palette (energy = red, neutral = gray).
import { type ReactNode, useRef } from "react";
import { cn } from "@/lib/cn";

type Tone = "energy" | "neutral";

interface StatTileProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  /** Small supporting line under the value. */
  hint?: ReactNode;
  tone?: Tone;
  onClick?: () => void;
  className?: string;
}

export default function StatTile({
  label,
  value,
  icon,
  hint,
  tone = "neutral",
  onClick,
  className,
}: StatTileProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onClick={onClick}
      className={cn(
        "group surface-card spotlight lift relative overflow-hidden p-5",
        onClick && "press cursor-pointer",
        className
      )}
    >
      {tone === "energy" && (
        <span
          className="pointer-events-none absolute left-0 top-0 h-1 w-12 rounded-br-xl bg-(image:--gradient-primary)"
          aria-hidden="true"
        />
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">{label}</p>
        {icon && (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 [&_svg]:h-4.5 [&_svg]:w-4.5",
              tone === "energy"
                ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                : "bg-muted text-foreground ring-1 ring-border"
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
      <p className="metric-number count-in mt-3 text-[2rem] text-(--text-primary)">{value}</p>
      {hint && <p className="mt-1 text-xs font-medium text-(--text-muted)">{hint}</p>}
    </div>
  );
}
