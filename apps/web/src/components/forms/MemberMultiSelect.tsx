import { useMemo, useState } from "react";
import { Check, Search, Users } from "lucide-react";
import { cn } from "@/lib/cn";

export interface MultiSelectOption {
  id: string;
  name: string;
  subtitle?: string;
}

interface MemberMultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  /** Selected ids. */
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  /** Max visible rows before the list scrolls. */
  maxHeight?: number;
}

/**
 * Searchable multi-select for assigning a plan to several members at once.
 * Trainers only ever see their assigned members (the list is server-scoped),
 * so this naturally enforces the assignment restriction in the UI.
 */
export default function MemberMultiSelect({
  label = "Assign to members",
  options,
  value,
  onChange,
  placeholder = "Search members…",
  emptyText = "No members available.",
  maxHeight = 224,
}: MemberMultiSelectProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.name.toLowerCase().includes(q) || (o.subtitle ?? "").toLowerCase().includes(q)
    );
  }, [options, query]);

  const selectedSet = useMemo(() => new Set(value), [value]);
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((o) => selectedSet.has(o.id));

  function toggle(id: string) {
    if (selectedSet.has(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  }

  function toggleAllFiltered() {
    if (allFilteredSelected) {
      const remove = new Set(filtered.map((o) => o.id));
      onChange(value.filter((v) => !remove.has(v)));
    } else {
      const merged = new Set(value);
      filtered.forEach((o) => merged.add(o.id));
      onChange([...merged]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-xs font-semibold text-(--text-muted)">
          {value.length} selected
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-(--surface-solid)">
        {/* Search + select-all */}
        <div className="flex items-center gap-2 border-b border-border p-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-muted)" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="h-9 w-full rounded-lg border border-transparent bg-(--surface-secondary) pl-8 pr-3 text-sm text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-primary/40"
            />
          </div>
          {filtered.length > 0 && (
            <button
              type="button"
              onClick={toggleAllFiltered}
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
            >
              {allFilteredSelected ? "Clear" : "Select all"}
            </button>
          )}
        </div>

        {/* List */}
        <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
              <Users className="h-6 w-6 text-(--text-muted)" />
              <p className="text-xs text-(--text-muted)">{query ? "No members match your search." : emptyText}</p>
            </div>
          ) : (
            filtered.map((o) => {
              const checked = selectedSet.has(o.id);
              return (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => toggle(o.id)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-(--surface-hover)"
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                      checked ? "border-primary bg-(image:--gradient-primary) text-white" : "border-border bg-transparent"
                    )}
                  >
                    {checked && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-(--text-primary)">{o.name}</span>
                    {o.subtitle && <span className="block truncate text-xs text-(--text-muted)">{o.subtitle}</span>}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
