import { create } from "zustand";
import type { SyncAction } from "../types/sync.types";

interface SyncStoreState {
  pendingActions: SyncAction[];
  isSyncing: boolean;
  lastSyncAt: string | null;
  isOnline: boolean;
  addPendingAction: (action: SyncAction) => void;
  clearAction: (clientId: string) => void;
  setOnline: (isOnline: boolean) => void;
  setIsSyncing: (isSyncing: boolean) => void;
  setLastSyncAt: (lastSyncAt: string | null) => void;
}

export const useSyncStore = create<SyncStoreState>((set) => ({
  pendingActions: [],
  isSyncing: false,
  lastSyncAt: null,
  isOnline: true,

  addPendingAction: (action) =>
    set((state) => ({
      pendingActions: [...state.pendingActions, action],
    })),

  clearAction: (clientId) =>
    set((state) => ({
      pendingActions: state.pendingActions.filter(
        (a) => a.clientId !== clientId
      ),
    })),

  setOnline: (isOnline) => set({ isOnline }),

  setIsSyncing: (isSyncing) => set({ isSyncing }),

  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
}));
