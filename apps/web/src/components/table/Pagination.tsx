import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  function handlePrevious() {
    if (canGoPrevious) onPageChange(page - 1);
  }

  function handleNext() {
    if (canGoNext) onPageChange(page + 1);
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3 shadow-sm dark:border-border dark:bg-muted">
      <p className="text-sm text-muted-foreground">
        Page <span className="font-semibold text-foreground dark:text-white">{page}</span> of{" "}
        <span className="font-semibold text-foreground dark:text-white">
          {totalPages}
        </span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:text-muted-foreground dark:hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:text-muted-foreground dark:hover:bg-muted"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}