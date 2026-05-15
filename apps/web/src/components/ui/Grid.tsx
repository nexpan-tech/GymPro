// src/components/ui/Grid.tsx
import clsx from "clsx";
import { ReactNode } from "react";

interface GridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export default function Grid({
  children,
  cols = 4,
  className,
}: GridProps) {
  return (
    <div
      className={clsx(
        "grid gap-5",
        {
          "grid-cols-1": cols === 1,
          "grid-cols-1 md:grid-cols-2": cols === 2,
          "grid-cols-1 md:grid-cols-2 xl:grid-cols-3": cols === 3,
          "grid-cols-1 md:grid-cols-2 xl:grid-cols-4": cols === 4,
        },
        className
      )}
    >
      {children}
    </div>
  );
}