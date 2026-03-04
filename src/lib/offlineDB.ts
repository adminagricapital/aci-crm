import { openDB, DBSchema, IDBPDatabase } from "idb";

interface ACIDBSchema extends DBSchema {
  beneficiaires: {
    key: string;
    value: any;
    indexes: { "by-synced": number; "by-commercial": string; "by-updated": string };
  };
  paiements: {
    key: string;
    value: any;
    indexes: { "by-synced": number; "by-updated": string };
  };
  cartes: {
    key: string;
    value: any;
    indexes: { "by-synced": number };
  };
  pending_actions: {
    key: number;
    value: {
      id?: number;
      table: string;
      action: "insert" | "update" | "delete";
      data: any;
      created_at: string;
    };
    indexes: { "by-table": string };
  };
  cached_auth: {
    key: string;
    value: {
      username: string;
      password_hash: string;
      user_data: any;
      cached_at: string;
    };
  };
  geo_cache: {
    key: string;
    value: {
      table: string;
      data: any[];
      cached_at: string;
    };
  };
  sync_meta: {
    key: string;
    value: {
      table: string;
      last_synced_at: string;
    };
  };
}

let dbInstance: IDBPDatabase<ACIDBSchema> | null = null;

export async function getDB(): Promise<IDBPDatabase<ACIDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ACIDBSchema>("aci-offline-db", 3, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const benStore = db.createObjectStore("beneficiaires", { keyPath: "id" });
        benStore.createIndex("by-synced", "_synced");
        benStore.createIndex("by-commercial", "commercial_id");
        benStore.createIndex("by-updated", "updated_at");

        const paiStore = db.createObjectStore("paiements", { keyPath: "id" });
        paiStore.createIndex("by-synced", "_synced");
        paiStore.createIndex("by-updated", "updated_at");

        const cartesStore = db.createObjectStore("cartes", { keyPath: "id" });
        cartesStore.createIndex("by-synced", "_synced");

        const pendingStore = db.createObjectStore("pending_actions", {
          keyPath: "id",
          autoIncrement: true,
        });
        pendingStore.createIndex("by-table", "table");

        db.createObjectStore("cached_auth", { keyPath: "username" });
        db.createObjectStore("geo_cache", { keyPath: "table" });
        db.createObjectStore("sync_meta", { keyPath: "table" });
      }
    },
  });

  return dbInstance;
}

// ============ Generic CRUD ============

export async function putRecord(store: "beneficiaires" | "paiements" | "cartes", record: any) {
  const db = await getDB();
  await db.put(store, { ...record, _synced: 0 });
}

export async function getRecord(store: "beneficiaires" | "paiements" | "cartes", id: string) {
  const db = await getDB();
  return db.get(store, id);
}

export async function getAllRecords(store: "beneficiaires" | "paiements" | "cartes") {
  const db = await getDB();
  return db.getAll(store);
}

export async function deleteRecord(store: "beneficiaires" | "paiements" | "cartes", id: string) {
  const db = await getDB();
  await db.delete(store, id);
}

export async function getUnsyncedRecords(store: "beneficiaires" | "paiements" | "cartes") {
  const db = await getDB();
  return db.getAllFromIndex(store, "by-synced", 0);
}

export async function markSynced(store: "beneficiaires" | "paiements" | "cartes", id: string) {
  const db = await getDB();
  const record = await db.get(store, id);
  if (record) {
    await db.put(store, { ...record, _synced: 1 });
  }
}

// ============ Pending Actions Queue ============

export async function addPendingAction(table: string, action: "insert" | "update" | "delete", data: any) {
  const db = await getDB();
  await db.add("pending_actions", {
    table,
    action,
    data,
    created_at: new Date().toISOString(),
  });
}

export async function getAllPendingActions() {
  const db = await getDB();
  return db.getAll("pending_actions");
}

export async function clearPendingAction(id: number) {
  const db = await getDB();
  await db.delete("pending_actions", id);
}

export async function getPendingCount() {
  const db = await getDB();
  return (await db.getAll("pending_actions")).length;
}

// ============ Auth Cache ============

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "aci-salt-2026");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function cacheAuthCredentials(username: string, password: string, userData: any) {
  const db = await getDB();
  const password_hash = await hashPassword(password);
  await db.put("cached_auth", {
    username,
    password_hash,
    user_data: userData,
    cached_at: new Date().toISOString(),
  });
}

export async function verifyOfflineCredentials(username: string, password: string): Promise<any | null> {
  const db = await getDB();
  const cached = await db.get("cached_auth", username);
  if (!cached) return null;

  const password_hash = await hashPassword(password);
  if (cached.password_hash !== password_hash) return null;

  // Check if cache is not older than 30 days
  const cachedAt = new Date(cached.cached_at).getTime();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - cachedAt > thirtyDays) return null;

  return cached.user_data;
}

// ============ Geo Cache ============

export async function cacheGeoData(table: string, data: any[]) {
  const db = await getDB();
  await db.put("geo_cache", { table, data, cached_at: new Date().toISOString() });
}

export async function getCachedGeoData(table: string): Promise<any[] | null> {
  const db = await getDB();
  const cached = await db.get("geo_cache", table);
  return cached?.data || null;
}

// ============ Sync Meta ============

export async function getLastSyncTime(table: string): Promise<string | null> {
  const db = await getDB();
  const meta = await db.get("sync_meta", table);
  return meta?.last_synced_at || null;
}

export async function setLastSyncTime(table: string) {
  const db = await getDB();
  await db.put("sync_meta", { table, last_synced_at: new Date().toISOString() });
}

// ============ Bulk operations ============

export async function bulkPutRecords(store: "beneficiaires" | "paiements" | "cartes", records: any[]) {
  const db = await getDB();
  const tx = db.transaction(store, "readwrite");
  for (const record of records) {
    await tx.store.put({ ...record, _synced: 1 });
  }
  await tx.done;
}

export async function clearStore(store: "beneficiaires" | "paiements" | "cartes") {
  const db = await getDB();
  await db.clear(store);
}
