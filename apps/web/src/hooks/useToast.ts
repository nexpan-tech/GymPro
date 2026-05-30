import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  /** Auto-dismiss duration in ms. Set to 0 to disable auto-dismiss. */
  duration: number;
}

// ─── Default durations per type ──────────────────────────────────────────────

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  info: 4000,
  warning: 5000,
  error: 6000,
};

// ─── Store ────────────────────────────────────────────────────────────────────

interface ToastStore {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, duration?: number) => string;
  dismissToast: (id: string) => void;
  clearAll: () => void;
}

let _counter = 0;
const nextId = () => `toast-${++_counter}-${Date.now()}`;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  showToast: (type, message, duration) => {
    const id = nextId();
    const resolvedDuration = duration ?? DEFAULT_DURATIONS[type];
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration: resolvedDuration }],
    }));
    return id;
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => set({ toasts: [] }),
}));

// ─── Convenience hook ─────────────────────────────────────────────────────────

export function useToast() {
  const { showToast, dismissToast, clearAll, toasts } = useToastStore();

  return {
    toasts,
    success: (message: string, duration?: number) =>
      showToast("success", message, duration),
    error: (message: string, duration?: number) =>
      showToast("error", message, duration),
    warning: (message: string, duration?: number) =>
      showToast("warning", message, duration),
    info: (message: string, duration?: number) =>
      showToast("info", message, duration),
    dismiss: dismissToast,
    clearAll,
  };
}
