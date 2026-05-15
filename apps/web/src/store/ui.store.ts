import { create } from "zustand";

export const useUIStore = create((set) => ({
  loading: false,
  setLoading: (loading: boolean) => set({ loading }),
}));