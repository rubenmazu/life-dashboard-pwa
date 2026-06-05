import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ProfileDatabase } from '@/db/schema';
import { useIncome } from '@/hooks/useIncome';

// Mock the ProfileContext to provide a test database
const mockDb: { current: ProfileDatabase | null } = { current: null };

vi.mock('@/context/ProfileContext', () => ({
  useProfile: () => ({
    activeProfileId: 'test-profile',
    isAuthenticated: true,
    db: mockDb.current,
    setActiveProfile: vi.fn(),
    clearActiveProfile: vi.fn(),
  }),
}));

describe('useIncome', () => {
  let db: ProfileDatabase;

  beforeEach(async () => {
    db = new ProfileDatabase('test-income-hook');
    mockDb.current = db;
  });

  afterEach(async () => {
    db.close();
    await db.delete();
    mockDb.current = null;
  });

  it('returns empty entries and zero total for a month with no data', async () => {
    const { result } = renderHook(() => useIncome('2024-06'));

    await waitFor(() => {
      expect(result.current.incomeEntries).toEqual([]);
    });

    expect(result.current.monthlyTotal).toBe(0);
  });

  it('returns income entries for the specified month', async () => {
    const now = Date.now();
    await db.incomeEntries.bulkAdd([
      { amount: 3000, source: 'Salary', month: '2024-06', createdAt: now, updatedAt: now },
      { amount: 500, source: 'Freelance', month: '2024-06', createdAt: now, updatedAt: now },
      { amount: 1000, source: 'Other', month: '2024-07', createdAt: now, updatedAt: now },
    ]);

    const { result } = renderHook(() => useIncome('2024-06'));

    await waitFor(() => {
      expect(result.current.incomeEntries).toHaveLength(2);
    });

    expect(result.current.incomeEntries[0].source).toBe('Salary');
    expect(result.current.incomeEntries[1].source).toBe('Freelance');
  });

  it('calculates monthlyTotal as sum of entry amounts', async () => {
    const now = Date.now();
    await db.incomeEntries.bulkAdd([
      { amount: 3000, source: 'Salary', month: '2024-06', createdAt: now, updatedAt: now },
      { amount: 500, source: 'Freelance', month: '2024-06', createdAt: now, updatedAt: now },
    ]);

    const { result } = renderHook(() => useIncome('2024-06'));

    await waitFor(() => {
      expect(result.current.monthlyTotal).toBe(3500);
    });
  });

  it('addIncome creates a new entry with correct fields', async () => {
    const { result } = renderHook(() => useIncome('2024-06'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addIncome(2500, 'Consulting');
    });

    await waitFor(() => {
      expect(result.current.incomeEntries).toHaveLength(1);
    });

    const entry = result.current.incomeEntries[0];
    expect(entry.amount).toBe(2500);
    expect(entry.source).toBe('Consulting');
    expect(entry.month).toBe('2024-06');
    expect(entry.createdAt).toBeGreaterThan(0);
    expect(entry.updatedAt).toBeGreaterThan(0);
  });

  it('addIncome throws on invalid amount', async () => {
    const { result } = renderHook(() => useIncome('2024-06'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.addIncome(0, 'Invalid');
      })
    ).rejects.toThrow('Amount must be between 0.01 and 999,999,999.99');
  });

  it('addIncome throws on empty source', async () => {
    const { result } = renderHook(() => useIncome('2024-06'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.addIncome(100, '');
      })
    ).rejects.toThrow('Source description is required');
  });

  it('updateIncome modifies the entry amount and source', async () => {
    const now = Date.now();
    const id = await db.incomeEntries.add({
      amount: 1000,
      source: 'Old Source',
      month: '2024-06',
      createdAt: now,
      updatedAt: now,
    });

    const { result } = renderHook(() => useIncome('2024-06'));

    await waitFor(() => {
      expect(result.current.incomeEntries).toHaveLength(1);
    });

    await act(async () => {
      await result.current.updateIncome(String(id), 2000, 'New Source');
    });

    await waitFor(() => {
      expect(result.current.incomeEntries[0].amount).toBe(2000);
    });

    expect(result.current.incomeEntries[0].source).toBe('New Source');
    expect(result.current.incomeEntries[0].updatedAt).toBeGreaterThanOrEqual(now);
  });

  it('updateIncome throws on invalid data', async () => {
    const now = Date.now();
    const id = await db.incomeEntries.add({
      amount: 1000,
      source: 'Source',
      month: '2024-06',
      createdAt: now,
      updatedAt: now,
    });

    const { result } = renderHook(() => useIncome('2024-06'));

    await waitFor(() => {
      expect(result.current.incomeEntries).toHaveLength(1);
    });

    await expect(
      act(async () => {
        await result.current.updateIncome(String(id), -5, 'Source');
      })
    ).rejects.toThrow('Amount must be between 0.01 and 999,999,999.99');
  });

  it('deleteIncome removes the entry', async () => {
    const now = Date.now();
    const id = await db.incomeEntries.add({
      amount: 1000,
      source: 'To Delete',
      month: '2024-06',
      createdAt: now,
      updatedAt: now,
    });

    const { result } = renderHook(() => useIncome('2024-06'));

    await waitFor(() => {
      expect(result.current.incomeEntries).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteIncome(String(id));
    });

    await waitFor(() => {
      expect(result.current.incomeEntries).toHaveLength(0);
    });

    expect(result.current.monthlyTotal).toBe(0);
  });

  it('recalculates monthlyTotal after add', async () => {
    const now = Date.now();
    await db.incomeEntries.add({
      amount: 1000,
      source: 'Initial',
      month: '2024-06',
      createdAt: now,
      updatedAt: now,
    });

    const { result } = renderHook(() => useIncome('2024-06'));

    await waitFor(() => {
      expect(result.current.monthlyTotal).toBe(1000);
    });

    await act(async () => {
      await result.current.addIncome(500, 'Extra');
    });

    await waitFor(() => {
      expect(result.current.monthlyTotal).toBe(1500);
    });
  });

  it('only returns entries for the requested month', async () => {
    const now = Date.now();
    await db.incomeEntries.bulkAdd([
      { amount: 1000, source: 'June', month: '2024-06', createdAt: now, updatedAt: now },
      { amount: 2000, source: 'July', month: '2024-07', createdAt: now, updatedAt: now },
    ]);

    const { result } = renderHook(() => useIncome('2024-07'));

    await waitFor(() => {
      expect(result.current.incomeEntries).toHaveLength(1);
    });

    expect(result.current.incomeEntries[0].source).toBe('July');
    expect(result.current.monthlyTotal).toBe(2000);
  });

  it('throws when no active database', async () => {
    mockDb.current = null;

    const { result } = renderHook(() => useIncome('2024-06'));

    await expect(
      act(async () => {
        await result.current.addIncome(100, 'Test');
      })
    ).rejects.toThrow('No active profile database');
  });
});
