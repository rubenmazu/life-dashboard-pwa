/**
 * Habit Status Cycling Utilities
 * Requirements 10.2, 10.3, 10.4: Tap cycles not_started → in_progress → completed → not_started
 * Requirement 10.8: Completion summary counts for each status
 */

export type HabitStatus = 'not_started' | 'in_progress' | 'completed';

export interface CompletionSummary {
  completed: number;
  inProgress: number;
  notStarted: number;
  total: number;
}

/**
 * Cycles a habit status to the next state.
 * not_started → in_progress → completed → not_started
 */
export function cycleStatus(current: HabitStatus): HabitStatus {
  switch (current) {
    case 'not_started':
      return 'in_progress';
    case 'in_progress':
      return 'completed';
    case 'completed':
      return 'not_started';
  }
}

/**
 * Computes a summary of habit statuses for a given set of habits.
 * Counts how many are in each state and returns the total.
 */
export function computeCompletionSummary(statuses: HabitStatus[]): CompletionSummary {
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;

  for (const status of statuses) {
    switch (status) {
      case 'completed':
        completed++;
        break;
      case 'in_progress':
        inProgress++;
        break;
      case 'not_started':
        notStarted++;
        break;
    }
  }

  return {
    completed,
    inProgress,
    notStarted,
    total: completed + inProgress + notStarted,
  };
}
