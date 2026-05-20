import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-semibold text-(--text-secondary)">
            {label}
          </label>
        )}

        <input
          ref={ref}
          className={clsx(
            "w-full rounded-xl border border-(--border) bg-(--surface-solid) px-4 py-3 text-sm text-(--text-primary) shadow-(--shadow-sm) outline-none transition",
            "placeholder:text-(--text-muted)",
            "focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10",
            "disabled:cursor-not-allowed disabled:opacity-60",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
            className
          )}
          {...props}
        />

        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;

