import {
  forwardRef,
  type TextareaHTMLAttributes,
} from "react";
import clsx from "clsx";

interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(({ label, error, className, rows = 4, ...props }, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground dark:text-muted-foreground">
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          "w-full rounded-xl border border-border bg-(--surface-solid) px-4 py-3 text-sm text-(--text-primary) shadow-sm outline-none transition",
          "placeholder:text-muted-foreground",
          "focus:border-primary/40 focus:ring-4 focus:ring-primary/40",
          "dark:border-border dark:bg-muted dark:text-white dark:placeholder:text-muted-foreground",
          error &&
            "border-primary/40 focus:border-primary/40 focus:ring-primary/40",
          className
        )}
        {...props}
      />

      {error && (
        <p className="text-sm text-primary">
          {error}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = "Textarea";

export default Textarea;