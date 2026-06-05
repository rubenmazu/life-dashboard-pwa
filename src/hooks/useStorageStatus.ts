import { useEffect, useState } from 'react';
import { checkStorageQuota, type StorageQuotaInfo } from '@/services/db.service';

/**
 * Hook that monitors storage availability and quota.
 * - Checks if IndexedDB is available (attempts to open a test DB)
 * - Monitors storage quota via checkStorageQuota()
 * - Exposes isIndexedDBAvailable, storageWarning, and quotaInfo
 * Requirements: 4.5, 4.7
 */

interface UseStorageStatusResult {
  isIndexedDBAvailable: boolean;
  storageWarning: string | null;
  quotaInfo: StorageQuotaInfo;
}

const DEFAULT_QUOTA_INFO: StorageQuotaInfo = {
  usage: 0,
  quota: 0,
  percentUsed: 0,
};

/**
 * Tests IndexedDB availability by attempting to open and immediately
 * delete a temporary database.
 */
async function testIndexedDBAvailability(): Promise<boolean> {
  try {
    if (typeof indexedDB === 'undefined') {
      return false;
    }

    return await new Promise<boolean>((resolve) => {
      const testDbName = '__idb_availability_test__';
      const request = indexedDB.open(testDbName, 1);

      request.onerror = () => resolve(false);
      request.onsuccess = () => {
        const db = request.result;
        db.close();
        // Clean up the test database
        indexedDB.deleteDatabase(testDbName);
        resolve(true);
      };
      request.onblocked = () => resolve(false);

      // Timeout after 2 seconds — consider unavailable
      setTimeout(() => resolve(false), 2000);
    });
  } catch {
    return false;
  }
}

export function useStorageStatus(): UseStorageStatusResult {
  const [isIndexedDBAvailable, setIsIndexedDBAvailable] = useState<boolean>(true);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<StorageQuotaInfo>(DEFAULT_QUOTA_INFO);

  useEffect(() => {
    let cancelled = false;

    async function checkStorage() {
      // Check IndexedDB availability
      const idbAvailable = await testIndexedDBAvailability();
      if (cancelled) return;

      setIsIndexedDBAvailable(idbAvailable);

      if (!idbAvailable) {
        setStorageWarning(
          'Storage is limited to 5 MB. Data loss may occur if the limit is exceeded.'
        );
      }

      // Check storage quota
      const quota = await checkStorageQuota();
      if (cancelled) return;

      setQuotaInfo(quota);

      // Warn if over 90% used (and IndexedDB is available)
      if (idbAvailable && quota.quota > 0 && quota.percentUsed >= 90) {
        setStorageWarning(
          `Storage is ${Math.round(quota.percentUsed)}% full. Consider exporting your data.`
        );
      }
    }

    checkStorage();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isIndexedDBAvailable, storageWarning, quotaInfo };
}
