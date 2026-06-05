import { describe, it, expect } from 'vitest';
import { cycleStatus, computeCompletionSummary, type HabitStatus } from '../../utils/habit-status';

describe('cycleStatus', () => {
  it('cycles not_started to in_progress', () => {
    expect(cycleStatus('not_started')).toBe('in_progress');
  });

  it('cycles in_progress to completed', () => {
    expect(cycleStatus('in_progress')).toBe('completed');
  });

  it('cycles completed back to not_started', () => {
    expect(cycleStatus('completed')).toBe('not_started');
  });

  it('three consecutive cycles return to the original status', () => {
    const statuses: HabitStatus[] = ['not_started', 'in_progress', 'completed'];
    for (const status of statuses) {
      const once = cycleStatus(status);
      const twice = cycleStatus(once);
      const thrice = cycleStatus(twice);
      expect(thrice).toBe(status);
    }
  });
});

describe('computeCompletionSummary', () => {
  it('returns zeros for an empty array', () => {
    const summary = computeCompletionSummary([]);
    expect(summary).toEqual({
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      total: 0,
    });
  });

  it('counts all completed statuses', () => {
    const summary = computeCompletionSummary(['completed', 'completed', 'completed']);
    expect(summary).toEqual({
      completed: 3,
      inProgress: 0,
      notStarted: 0,
      total: 3,
    });
  });

  it('counts all in_progress statuses', () => {
    const summary = computeCompletionSummary(['in_progress', 'in_progress']);
    expect(summary).toEqual({
      completed: 0,
      inProgress: 2,
      notStarted: 0,
      total: 2,
    });
  });

  it('counts all not_started statuses', () => {
    const summary = computeCompletionSummary(['not_started', 'not_started', 'not_started', 'not_started']);
    expect(summary).toEqual({
      completed: 0,
      inProgress: 0,
      notStarted: 4,
      total: 4,
    });
  });

  it('counts a mixed set of statuses correctly', () => {
    const statuses: HabitStatus[] = [
      'completed', 'in_progress', 'not_started',
      'completed', 'not_started', 'in_progress',
      'completed',
    ];
    const summary = computeCompletionSummary(statuses);
    expect(summary).toEqual({
      completed: 3,
      inProgress: 2,
      notStarted: 2,
      total: 7,
    });
  });

  it('total always equals the sum of all individual counts', () => {
    const statuses: HabitStatus[] = ['completed', 'in_progress', 'not_started', 'completed', 'not_started'];
    const summary = computeCompletionSummary(statuses);
    expect(summary.total).toBe(summary.completed + summary.inProgress + summary.notStarted);
  });

  it('total equals the input array length', () => {
    const statuses: HabitStatus[] = ['completed', 'in_progress', 'not_started', 'in_progress'];
    const summary = computeCompletionSummary(statuses);
    expect(summary.total).toBe(statuses.length);
  });
});
