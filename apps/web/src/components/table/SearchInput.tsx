import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: SearchInputProps) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-10 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/40 dark:border-border dark:bg-muted dark:text-white dark:placeholder:text-muted-foreground"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}