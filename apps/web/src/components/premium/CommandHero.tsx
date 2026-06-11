// CommandHero — the jet-black "command center" hero block used at the top of
// every role dashboard. Premium power surface, display headline with a red
// energy accent, supporting copy, optional snapshot stats + primary action.
import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CommandStat {
  label: string;
  value: ReactNode;
  /** Optional small caption under the value. */
  hint?: string;
}

interface CommandHeroProps {
  /** Small uppercase line above the title (e.g. greeting · date). */
  eyebrow?: ReactNode;
  /** Main headline. Wrap the energetic part in <Highlight> for the red accent. */
  title: ReactNode;
  /** Supporting sentence under the title. */
  subtitle?: ReactNode;
  /** Snapshot metric pills shown on the right. */
  stats?: CommandStat[];
  /** Primary action(s) / controls rendered under or beside the stats. */
  actions?: ReactNode;
  className?: string;
}

/** Renders text with the GymPro red gradient — use inside CommandHero titles. */
export function Highlight({ children }: { children: ReactNode }) {
  return <span className="text-gradient-red">{children}</span>;
}

export default function CommandHero({
  eyebrow,
  title,
  subtitle,
  stats,
  actions,
  className,
}: CommandHeroProps) {
  return (
    <section className={cn("command-surface reveal p-7 md:p-9", className)}>
      <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        {/* Copy block */}
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-white/55">
              {eyebrow}
            </p>
          )}
          <h1 className="text-display mt-3 text-[1.9rem] leading-[1.05] text-white md:text-[2.6rem]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
              {subtitle}
            </p>
          )}
          {actions && (
            <div className="mt-6 flex flex-wrap items-center gap-2.5">{actions}</div>
          )}
        </div>

        {/* Snapshot stats */}
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            {stats.map((s, i) => (
              <div key={i} className="stat-pill min-w-[7.5rem] px-4 py-3">
                <p className="metric-number text-2xl text-white">{s.value}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/55">
                  {s.label}
                </p>
                {s.hint && (
                  <p className="mt-0.5 text-[10px] font-medium text-white/40">{s.hint}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
