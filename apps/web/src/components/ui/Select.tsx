import clsx from "clsx";
import type { SelectHTMLAttributes, ReactNode } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  children: ReactNode;
}

export default function Select({
  label,
  helperText,
  error,
  className,
  children,
  ...props
}: SelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <select
        className={clsx(
          "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          "dark:border-gray-700 dark:bg-gray-900 dark:text-white",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...props}
      >
        {children}
      </select>

      {helperText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
