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
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition",
          "placeholder:text-gray-400",
          "focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10",
          "dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500",
          error &&
            "border-red-500 focus:border-red-500 focus:ring-red-500/10",
          className
        )}
        {...props}
      />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = "Textarea";

export default Textarea;