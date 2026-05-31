import { useCallback } from 'react';
import { apiClient } from '../api/client';
import { useSyncStore } from '../stores/sync.store';
import type { SyncAction, SyncResult } from '../types/sync.types';

export interface MobileSyncHook {
  syncPendingActions: () => Promise<void>;
  addToSyncQueue: (action: SyncAction) => void;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
}

export function useMobileSync(): MobileSyncHook {
  const {
    pendingActions,
    isSyncing,
    lastSyncAt,
    addPendingAction,
    clearAction,
    setIsSyncing,
    setLastSyncAt,
  } = useSyncStore();

  const syncPendingActions = useCallback(async (): Promise<void> => {
    if (pendingActions.length === 0) return;

    setIsSyncing(true);

    try {
      const res = await apiClient.post<{ results: SyncResult[] }>(
        '/mobile/sync',
        { actions: pendingActions },
      );

      const results = res.data.results;

      for (const result of results) {
        if (result.success) {
          clearAction(result.clientId);
        }
      }

      setLastSyncAt(new Date().toISOString());
    } catch {
      // Keep pending actions in the queue for the next sync attempt.
      setIsSyncing(false);
      return;
    }

    setIsSyncing(false);
  }, [pendingActions, clearAction, setIsSyncing, setLastSyncAt]);

  const addToSyncQueue = useCallback(
    (action: SyncAction): void => {
      addPendingAction(action);
      syncPendingActions().catch(console.error);
    },
    [addPendingAction, syncPendingActions],
  );

  return {
    syncPendingActions,
    addToSyncQueue,
    isSyncing,
    pendingCount: pendingActions.length,
    lastSyncAt,
  };
}
