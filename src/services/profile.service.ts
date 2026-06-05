import { v4 as uuidv4 } from 'uuid';

const PROFILES_STORAGE_KEY = 'profiles';
const MAX_PROFILES = 8;
const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 30;

export interface ProfileMeta {
  id: string;
  name: string;
  hasAuth: boolean;
  authType: 'biometric' | 'pin' | null;
  createdAt: number;
}

export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

/**
 * Read all profiles from localStorage.
 */
export function getProfiles(): ProfileMeta[] {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ProfileMeta[];
  } catch {
    return [];
  }
}

/**
 * Persist the profiles array to localStorage.
 */
function persistProfiles(profiles: ProfileMeta[]): void {
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
}

/**
 * Validate a profile name against length and uniqueness rules.
 */
export function validateProfileName(
  name: string,
  existingProfiles: ProfileMeta[]
): ValidationResult {
  if (name.length < MIN_NAME_LENGTH) {
    return { valid: false, error: 'Profile name must be at least 1 character' };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { valid: false, error: 'Profile name must be at most 30 characters' };
  }

  const nameLower = name.toLowerCase();
  const isDuplicate = existingProfiles.some(
    (p) => p.name.toLowerCase() === nameLower
  );

  if (isDuplicate) {
    return { valid: false, error: 'A profile with this name already exists' };
  }

  return { valid: true, error: null };
}

/**
 * Create a new profile with the given name.
 * Validates name and enforces max 8 profiles.
 * Returns the created ProfileMeta.
 * Throws if validation fails or max profiles reached.
 */
export function createProfile(name: string): ProfileMeta {
  const existing = getProfiles();

  if (existing.length >= MAX_PROFILES) {
    throw new Error('Maximum of 8 profiles reached');
  }

  const validation = validateProfileName(name, existing);
  if (!validation.valid) {
    throw new Error(validation.error!);
  }

  const profile: ProfileMeta = {
    id: uuidv4(),
    name,
    hasAuth: false,
    authType: null,
    createdAt: Date.now(),
  };

  persistProfiles([...existing, profile]);
  return profile;
}

/**
 * Delete a profile by ID.
 * Throws if the profile is the last remaining one or doesn't exist.
 */
export function deleteProfile(id: string): void {
  const existing = getProfiles();

  const profileIndex = existing.findIndex((p) => p.id === id);
  if (profileIndex === -1) {
    throw new Error('Profile not found');
  }

  if (existing.length <= 1) {
    throw new Error('Cannot delete the last profile. At least one profile must exist');
  }

  const updated = existing.filter((p) => p.id !== id);
  persistProfiles(updated);
}

/**
 * Update a profile by ID with partial changes.
 * Throws if the profile doesn't exist or if name update fails validation.
 */
export function updateProfile(id: string, updates: Partial<ProfileMeta>): void {
  const existing = getProfiles();

  const profileIndex = existing.findIndex((p) => p.id === id);
  if (profileIndex === -1) {
    throw new Error('Profile not found');
  }

  // If name is being updated, validate it
  if (updates.name !== undefined) {
    const othersForValidation = existing.filter((p) => p.id !== id);
    const validation = validateProfileName(updates.name, othersForValidation);
    if (!validation.valid) {
      throw new Error(validation.error!);
    }
  }

  const updatedProfile = { ...existing[profileIndex], ...updates, id }; // Prevent ID override
  const updatedProfiles = [...existing];
  updatedProfiles[profileIndex] = updatedProfile;
  persistProfiles(updatedProfiles);
}
