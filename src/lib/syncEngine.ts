import { supabase } from "@/integrations/supabase/client";
import {
  getAllPendingActions,
  clearPendingAction,
  bulkPutRecords,
  getLastSyncTime,
  setLastSyncTime,
  cacheGeoData,
  getPendingCount,
} from "./offlineDB";

export interface SyncResult {
  pushed: number;
  pulled: number;
  failed: number;
  errors: string[];
}

// ============ PUSH: Local → Supabase ============

async function pushPendingActions(): Promise<{ pushed: number; failed: number; errors: string[] }> {
  const actions = await getAllPendingActions();
  let pushed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const action of actions) {
    try {
      if (action.action === "insert") {
        const { _synced, ...cleanData } = action.data;
        const { error } = await supabase.from(action.table as any).insert(cleanData);
        if (error) throw error;
      } else if (action.action === "update") {
        const { id, _synced, ...rest } = action.data;
        const { error } = await supabase.from(action.table as any).update(rest).eq("id", id);
        if (error) throw error;
      } else if (action.action === "delete") {
        const { error } = await supabase.from(action.table as any).delete().eq("id", action.data.id);
        if (error) throw error;
      }
      await clearPendingAction(action.id!);
      pushed++;
    } catch (err: any) {
      console.error(`Sync push error [${action.table}/${action.action}]:`, err);
      errors.push(`${action.table}: ${err.message}`);
      failed++;
    }
  }

  return { pushed, failed, errors };
}

// ============ PULL: Supabase → Local ============

async function pullTable(
  table: "beneficiaires" | "paiements" | "cartes",
  userId?: string
): Promise<number> {
  const lastSync = await getLastSyncTime(table);
  
  let query = supabase.from(table).select("*");
  
  if (lastSync) {
    query = query.gte("updated_at", lastSync);
  }

  // For beneficiaires, limit to user's own or team's
  if (table === "beneficiaires" && userId) {
    // Don't filter here - RLS handles it
  }

  const { data, error } = await query;
  
  if (error) {
    console.error(`Pull error [${table}]:`, error);
    return 0;
  }

  if (data && data.length > 0) {
    await bulkPutRecords(table, data);
  }

  await setLastSyncTime(table);
  return data?.length || 0;
}

// ============ Pull Geo Data ============

async function pullGeoData() {
  const tables = ["districts", "regions", "departements", "sous_prefectures", "villages"] as const;
  
  for (const table of tables) {
    const { data } = await supabase.from(table).select("*").eq("actif", true).order("nom");
    if (data) {
      await cacheGeoData(table, data);
    }
  }
}

// ============ Full Sync ============

export async function fullSync(userId?: string): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, failed: 0, errors: [] };

  if (!navigator.onLine) {
    return { ...result, errors: ["Hors connexion"] };
  }

  // 1. Push local changes first
  const pushResult = await pushPendingActions();
  result.pushed = pushResult.pushed;
  result.failed = pushResult.failed;
  result.errors = pushResult.errors;

  // 2. Pull remote changes
  try {
    const tables: ("beneficiaires" | "paiements" | "cartes")[] = ["beneficiaires", "paiements", "cartes"];
    for (const table of tables) {
      const pulled = await pullTable(table, userId);
      result.pulled += pulled;
    }
  } catch (err: any) {
    result.errors.push(`Pull error: ${err.message}`);
  }

  // 3. Refresh geo cache
  try {
    await pullGeoData();
  } catch (err: any) {
    console.error("Geo cache error:", err);
  }

  // 4. Log sync
  if (userId) {
    try {
      await supabase.from("sync_logs").insert({
        user_id: userId,
        action: "full_sync",
        records_synced: result.pushed + result.pulled,
        records_failed: result.failed,
        status: result.failed > 0 ? "partial" : "success",
        details: { pushed: result.pushed, pulled: result.pulled, errors: result.errors },
      });
    } catch (e) {
      // Silent fail for sync log
    }
  }

  return result;
}

export async function getOfflinePendingCount(): Promise<number> {
  return getPendingCount();
}
