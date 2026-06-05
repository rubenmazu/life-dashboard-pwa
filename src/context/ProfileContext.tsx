import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { getProfileDb, closeProfileDb } from '@/services/db.service';
import type { ProfileDatabase } from '@/db/schema';

/**
 * ProfileContext — Provides active profile state, authentication flag,
 * and the per-profile Dexie database instance.
 */

export interface ProfileContextValue {
  activeProfileId: string | null;
  isAuthenticated: boolean;
  db: ProfileDatabase | null;
  setActiveProfile: (profileId: string) => void;
  clearActiveProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfileId, setActiveProfileId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('active_profile');
    } catch {
      return null;
    }
  });

  const [db, setDb] = useState<ProfileDatabase | null>(() => {
    try {
      const storedId = localStorage.getItem('active_profile');
      return storedId ? getProfileDb(storedId) : null;
    } catch {
      return null;
    }
  });

  // Track the current profile ID to close the previous DB on switch
  const previousProfileIdRef = useRef<string | null>(activeProfileId);

  const isAuthenticated = activeProfileId !== null;

  const setActiveProfile = useCallback((profileId: string) => {
    // Close previous profile's DB if switching profiles
    const prevId = previousProfileIdRef.current;
    if (prevId && prevId !== profileId) {
      closeProfileDb(prevId);
    }

    setActiveProfileId(profileId);
    const newDb = getProfileDb(profileId);
    setDb(newDb);
    previousProfileIdRef.current = profileId;

    try {
      localStorage.setItem('active_profile', profileId);
    } catch {
      // LocalStorage may be unavailable
    }
  }, []);

  const clearActiveProfile = useCallback(() => {
    const prevId = previousProfileIdRef.current;
    if (prevId) {
      closeProfileDb(prevId);
    }

    setActiveProfileId(null);
    setDb(null);
    previousProfileIdRef.current = null;

    try {
      localStorage.removeItem('active_profile');
    } catch {
      // LocalStorage may be unavailable
    }
  }, []);

  return (
    <ProfileContext.Provider
      value={{ activeProfileId, isAuthenticated, db, setActiveProfile, clearActiveProfile }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
