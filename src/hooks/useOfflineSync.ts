import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fullSync, getOfflinePendingCount } from "@/lib/syncEngine";

interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncResult: { pushed: number; pulled: number; failed: number } | null;
}

export function useOfflineSync() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    pendingCount: 0,
    isSyncing: false,
    lastSyncResult: null,
  });

  // Track online/offline
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      triggerSync();
    };
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user]);

  // Update pending count periodically
  useEffect(() => {
    const updateCount = async () => {
      const count = await getOfflinePendingCount();
      setStatus(prev => ({ ...prev, pendingCount: count }));
    };
    updateCount();
    const interval = setInterval(updateCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!user || !navigator.onLine) return;

    setStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const result = await fullSync(user.id);
      const count = await getOfflinePendingCount();
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        pendingCount: count,
        lastSyncResult: { pushed: result.pushed, pulled: result.pulled, failed: result.failed },
      }));
    } catch (err) {
      console.error("Sync error:", err);
      setStatus(prev => ({ ...prev, isSyncing: false }));
    }
  }, [user]);

  return { ...status, triggerSync };
}
