import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SyncStatus {
  isOnline: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  isSyncing: boolean;
  syncLogs: SyncLog[];
}

interface SyncLog {
  id: string;
  action: string;
  records_synced: number;
  records_failed: number;
  status: string;
  created_at: string;
}

const OFFLINE_QUEUE_KEY = "aci_offline_queue";
const LAST_SYNC_KEY = "aci_last_sync";

export function useOfflineSync() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSyncAt: localStorage.getItem(LAST_SYNC_KEY),
    pendingCount: 0,
    isSyncing: false,
    syncLogs: [],
  });

  // Track online/offline
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      syncPendingData();
    };
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user]);

  // Load pending queue count
  useEffect(() => {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    setStatus(prev => ({ ...prev, pendingCount: queue.length }));
  }, []);

  // Load sync logs
  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      const { data } = await supabase
        .from("sync_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setStatus(prev => ({ ...prev, syncLogs: data as any }));
    };
    fetchLogs();
  }, [user]);

  // Add to offline queue
  const addToQueue = useCallback((action: string, table: string, data: any) => {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    queue.push({ action, table, data, timestamp: new Date().toISOString() });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    setStatus(prev => ({ ...prev, pendingCount: queue.length }));
  }, []);

  // Sync pending data
  const syncPendingData = useCallback(async () => {
    if (!user || !navigator.onLine) return;

    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    if (queue.length === 0) return;

    setStatus(prev => ({ ...prev, isSyncing: true }));
    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        if (item.action === "insert") {
          const { error } = await supabase.from(item.table).insert(item.data);
          if (error) throw error;
          synced++;
        } else if (item.action === "update") {
          const { id, ...rest } = item.data;
          const { error } = await supabase.from(item.table).update(rest).eq("id", id);
          if (error) throw error;
          synced++;
        }
      } catch (err) {
        console.error("Sync error:", err);
        failed++;
      }
    }

    // Clear queue
    localStorage.setItem(OFFLINE_QUEUE_KEY, "[]");
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SYNC_KEY, now);

    // Log sync
    await supabase.from("sync_logs").insert({
      user_id: user.id,
      action: "sync_offline_data",
      records_synced: synced,
      records_failed: failed,
      status: failed > 0 ? "partial" : "success",
    });

    setStatus(prev => ({
      ...prev,
      isSyncing: false,
      pendingCount: 0,
      lastSyncAt: now,
    }));
  }, [user]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    await syncPendingData();
  }, [syncPendingData]);

  // Auto-sync every 30 seconds if online
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine && user) syncPendingData();
    }, 30000);
    return () => clearInterval(interval);
  }, [syncPendingData, user]);

  return { ...status, addToQueue, triggerSync };
}
