import {
  forwardRef,
  type SelectHTMLAttributes,
} from "react";
import clsx from "clsx";

interface Option {
  label: string;
  value: string;
}

interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      placeholder = "Select an option",
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-foreground dark:text-muted-foreground">
            {label}
          </label>
        )}

        <select
          ref={ref}
          className={clsx(
            "w-full rounded-xl border border-border bg-(--surface-solid) px-4 py-3 text-sm text-(--text-primary) shadow-sm outline-none transition",
            "focus:border-primary/40 focus:ring-4 focus:ring-primary/40",
            "dark:border-border dark:bg-muted dark:text-white",
            error &&
              "border-primary/40 focus:border-primary/40 focus:ring-primary/40",
            className
          )}
          {...props}
        >
          <option value="">{placeholder}</option>

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="text-sm text-primary">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;