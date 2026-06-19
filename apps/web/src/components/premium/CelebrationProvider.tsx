import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CelebrationBanner } from "./Delight";
import { CELEBRATIONS, type CelebrationType } from "@/lib/celebrations";

// Phase M — app-wide celebration infrastructure. Mount <CelebrationProvider>
// once near the root; any component calls `useCelebrate()(type)` to fire a
// premium, non-intrusive, auto-dismissing celebration overlay.

type CelebrateFn = (type: CelebrationType, opts?: { message?: string }) => void;

const CelebrationContext = createContext<CelebrateFn>(() => {});

export function useCelebrate(): CelebrateFn {
  return useContext(CelebrationContext);
}

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<{ type: CelebrationType; message?: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const celebrate = useCallback<CelebrateFn>((type, opts) => {
    setActive({ type, message: opts?.message });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(null), 6500);
  }, []);

  const def = active ? CELEBRATIONS[active.type] : null;

  return (
    <CelebrationContext.Provider value={celebrate}>
      {children}
      {def && typeof document !== "undefined" &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
            <div className="pointer-events-auto w-full max-w-md">
              <CelebrationBanner
                emoji={def.emoji}
                title={def.title}
                message={active?.message ?? def.message}
                onDismiss={() => setActive(null)}
              />
            </div>
          </div>,
          document.body,
        )}
    </CelebrationContext.Provider>
  );
}
