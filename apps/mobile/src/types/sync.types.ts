export interface SyncAction {
  clientId: string;
  type: string;
  payload: unknown;
  createdAt: string;
  retryCount?: number;
}

export interface SyncResult {
  clientId: string;
  success: boolean;
  error?: string;
}

export interface SyncState {
  pendingActions: SyncAction[];
  isSyncing: boolean;
  lastSyncAt: string | null;
  isOnline: boolean;
}
