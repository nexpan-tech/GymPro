import { create } from "zustand";

export const useFiltersStore = create((set) => ({
  search: "",
  setSearch: (search: string) => set({ search }),
}));