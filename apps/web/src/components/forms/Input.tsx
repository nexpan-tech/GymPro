import {
  forwardRef,
  type InputHTMLAttributes,
} from "react";
import clsx from "clsx";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-foreground dark:text-muted-foreground">
            {label}
          </label>
        )}


        <input
          ref={ref}
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
  }
);

Input.displayName = "Input";

export default Input;