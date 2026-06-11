import { type InputHTMLAttributes, useEffect, useRef, useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  /** Debounce delay in milliseconds. Default: 300 */
  debounceMs?: number;
  placeholder?: string;
  /** Called with debounced value — useful if you want a separate callback for the settled search */
  onSearch?: (value: string) => void;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SearchInput({
  value,
  onChange,
  debounceMs = 300,
  placeholder = "Search…",
  onSearch,
  className,
  ...props
}: SearchInputProps) {
  // Internal state tracks what the user typed so the input is always responsive.
  // The debounce effect fires onChange/onSearch after the delay.
  const [internal, setInternal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value into internal when controlled value resets (e.g. cleared from outside)
  useEffect(() => {
    setInternal(value);
  }, [value]);

  const fireChange = useCallback(
    (next: string) => {
      onChange(next);
      onSearch?.(next);
    },
    [onChange, onSearch]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setInternal(next);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fireChange(next), debounceMs);
  }

  function handleClear() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setInternal("");
    fireChange("");
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const hasValue = internal.length > 0;

  return (
    <div className={cn("relative flex items-center", className)}>
      {/* Search icon */}
      <Search
        className="pointer-events-none absolute left-3.5 h-4 w-4 text-(--text-muted)"
        aria-hidden="true"
      />

      <input
        type="search"
        value={internal}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "h-10 w-full rounded-xl",
          "border border-border bg-(--surface-solid)",
          "pl-10 pr-10 text-sm text-(--text-primary)",
          "shadow-(--shadow-sm) outline-none",
          "placeholder:text-(--text-muted)",
          "transition-all duration-200",
          "focus:border-primary/40 focus:ring-4 focus:ring-primary/40",
          "disabled:cursor-not-allowed disabled:opacity-60",
          // hide browser's native clear button (overlaps our custom one)
          "[&::-webkit-search-cancel-button]:hidden"
        )}
        {...props}
      />

      {/* Clear button */}
      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className={cn(
            "absolute right-3 flex h-5 w-5 items-center justify-center rounded-full",
            "bg-(--surface-hover) text-(--text-muted)",
            "transition-colors hover:bg-border hover:text-(--text-primary)",
            "focus:outline-none focus:ring-2 focus:ring-primary/40"
          )}
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
