// apps/web/src/components/common/SearchInput.tsx

import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-muted)" />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-(--surface-solid) py-2 pl-10 pr-10 text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}