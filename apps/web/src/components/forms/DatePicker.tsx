import {
  forwardRef,
  type InputHTMLAttributes,
} from "react";
import clsx from "clsx";

interface DatePickerProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const DatePicker = forwardRef<
  HTMLInputElement,
  DatePickerProps
>(({ label, error, className, ...props }, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <input
        ref={ref}
        type="date"
        className={clsx(
          "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition",
          "focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10",
          "dark:border-gray-700 dark:bg-gray-900 dark:text-white",
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

DatePicker.displayName = "DatePicker";

export default DatePicker;