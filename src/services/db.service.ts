import { ProfileDatabase } from '@/db/schema';

// ─── Singleton cache of database instances ────────────────────────────────────

const dbCache = new Map<string, ProfileDatabase>();

/**
 * Get or create a cached Dexie database instance for the given profile.
 * Reuses existing instances to avoid recreating databases.
 */
export function getProfileDb(profileId: string): ProfileDatabase {
  const cached = dbCache.get(profileId);
  if (cached) {
    return cached;
  }

  const db = new ProfileDatabase(profileId);
  dbCache.set(profileId, db);
  return db;
}

// ─── Database deletion ────────────────────────────────────────────────────────

/**
 * Close and permanently delete the database for a profile.
 * Removes the instance from the cache after deletion.
 */
export async function deleteProfileDb(profileId: string): Promise<void> {
  const cached = dbCache.get(profileId);
  if (cached) {
    cached.close();
    dbCache.delete(profileId);
  }

  // Delete the database even if it wasn't in the cache
  await ProfileDatabase.delete(`life_dash_profile_${profileId}`);
}

// ─── Database close ───────────────────────────────────────────────────────────

/**
 * Close the database connection for a profile and remove it from the cache.
 * Use this when switching profiles or cleaning up resources without deleting data.
 */
export function closeProfileDb(profileId: string): void {
  const cached = dbCache.get(profileId);
  if (cached) {
    cached.close();
    dbCache.delete(profileId);
  }
}

// ─── Storage quota check ──────────────────────────────────────────────────────

export interface StorageQuotaInfo {
  usage: number;
  quota: number;
  percentUsed: number;
}

/**
 * Check the current storage quota usage via the StorageManager API.
 * Returns zeros if the StorageManager API is not available.
 */
export async function checkStorageQuota(): Promise<StorageQuotaInfo> {
  if (!navigator?.storage?.estimate) {
    return { usage: 0, quota: 0, percentUsed: 0 };
  }

  const estimate = await navigator.storage.estimate();
  const usage = estimate.usage ?? 0;
  const quota = estimate.quota ?? 0;
  const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

  return { usage, quota, percentUsed };
}
