import { describe, it, expect, beforeEach } from 'vitest';
import {
  getProfiles,
  createProfile,
  deleteProfile,
  updateProfile,
  validateProfileName,
  type ProfileMeta,
} from '../../services/profile.service';

describe('profile.service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getProfiles', () => {
    it('returns empty array when no profiles exist', () => {
      expect(getProfiles()).toEqual([]);
    });

    it('returns stored profiles', () => {
      const profiles: ProfileMeta[] = [
        { id: '1', name: 'Test', hasAuth: false, authType: null, createdAt: 1000 },
      ];
      localStorage.setItem('profiles', JSON.stringify(profiles));
      expect(getProfiles()).toEqual(profiles);
    });

    it('returns empty array for invalid JSON', () => {
      localStorage.setItem('profiles', 'not-json');
      expect(getProfiles()).toEqual([]);
    });

    it('returns empty array if stored value is not an array', () => {
      localStorage.setItem('profiles', JSON.stringify({ name: 'oops' }));
      expect(getProfiles()).toEqual([]);
    });
  });

  describe('validateProfileName', () => {
    it('rejects empty name', () => {
      const result = validateProfileName('', []);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 1 character');
    });

    it('rejects name exceeding 30 characters', () => {
      const result = validateProfileName('a'.repeat(31), []);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at most 30 characters');
    });

    it('accepts name of exactly 1 character', () => {
      const result = validateProfileName('A', []);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('accepts name of exactly 30 characters', () => {
      const result = validateProfileName('a'.repeat(30), []);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('rejects duplicate name (case-insensitive)', () => {
      const existing: ProfileMeta[] = [
        { id: '1', name: 'Alice', hasAuth: false, authType: null, createdAt: 1000 },
      ];
      const result = validateProfileName('ALICE', existing);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('accepts unique name among existing profiles', () => {
      const existing: ProfileMeta[] = [
        { id: '1', name: 'Alice', hasAuth: false, authType: null, createdAt: 1000 },
      ];
      const result = validateProfileName('Bob', existing);
      expect(result.valid).toBe(true);
    });
  });

  describe('createProfile', () => {
    it('creates a profile with valid name', () => {
      const profile = createProfile('Alice');
      expect(profile.name).toBe('Alice');
      expect(profile.id).toBeTruthy();
      expect(profile.hasAuth).toBe(false);
      expect(profile.authType).toBeNull();
      expect(profile.createdAt).toBeGreaterThan(0);

      const stored = getProfiles();
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('Alice');
    });

    it('throws when name is empty', () => {
      expect(() => createProfile('')).toThrow('at least 1 character');
    });

    it('throws when name exceeds 30 chars', () => {
      expect(() => createProfile('a'.repeat(31))).toThrow('at most 30 characters');
    });

    it('throws when name is duplicate (case-insensitive)', () => {
      createProfile('Alice');
      expect(() => createProfile('alice')).toThrow('already exists');
    });

    it('throws when 8 profiles already exist', () => {
      for (let i = 0; i < 8; i++) {
        createProfile(`Profile${i}`);
      }
      expect(() => createProfile('Ninth')).toThrow('Maximum of 8 profiles');
    });

    it('generates unique IDs for each profile', () => {
      const p1 = createProfile('One');
      const p2 = createProfile('Two');
      expect(p1.id).not.toBe(p2.id);
    });
  });

  describe('deleteProfile', () => {
    it('deletes an existing profile', () => {
      const p1 = createProfile('Alice');
      createProfile('Bob');
      deleteProfile(p1.id);
      const remaining = getProfiles();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].name).toBe('Bob');
    });

    it('throws when trying to delete the last profile', () => {
      const p = createProfile('Only');
      expect(() => deleteProfile(p.id)).toThrow('Cannot delete the last profile');
    });

    it('throws when profile does not exist', () => {
      createProfile('Alice');
      expect(() => deleteProfile('nonexistent-id')).toThrow('Profile not found');
    });
  });

  describe('updateProfile', () => {
    it('updates profile name', () => {
      const p = createProfile('Alice');
      updateProfile(p.id, { name: 'Alice Updated' });
      const profiles = getProfiles();
      expect(profiles[0].name).toBe('Alice Updated');
    });

    it('updates auth properties', () => {
      const p = createProfile('Alice');
      updateProfile(p.id, { hasAuth: true, authType: 'biometric' });
      const profiles = getProfiles();
      expect(profiles[0].hasAuth).toBe(true);
      expect(profiles[0].authType).toBe('biometric');
    });

    it('throws when profile not found', () => {
      expect(() => updateProfile('nonexistent', { name: 'X' })).toThrow('Profile not found');
    });

    it('throws when updated name is duplicate', () => {
      createProfile('Alice');
      const p2 = createProfile('Bob');
      expect(() => updateProfile(p2.id, { name: 'alice' })).toThrow('already exists');
    });

    it('allows updating to the same name (case preserved)', () => {
      const p = createProfile('Alice');
      // Renaming to same value with different casing should still pass if
      // the only match is the profile being updated
      updateProfile(p.id, { name: 'ALICE' });
      const profiles = getProfiles();
      expect(profiles[0].name).toBe('ALICE');
    });

    it('prevents overriding the profile ID', () => {
      const p = createProfile('Alice');
      updateProfile(p.id, { id: 'hacked-id' } as Partial<ProfileMeta>);
      const profiles = getProfiles();
      expect(profiles[0].id).toBe(p.id);
    });
  });
});
