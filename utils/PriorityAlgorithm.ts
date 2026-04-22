// Pure, offline priority scoring — no API calls, no external dependencies.
// Used as a fast fallback when OpenAI is unavailable and on every app launch
// before the AI scores arrive.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TaskCategory =
  | 'work'
  | 'personal'
  | 'health'
  | 'social'
  | 'relationship'
  | 'legal'
  | 'routine';

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  deadline?: Date;
  is_completed: boolean;
  created_at: Date;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

/** Importance weights by category (maps directly to importanceScore). */
const CATEGORY_WEIGHT: Record<TaskCategory, number> = {
  legal:        100,
  health:        90,
  work:          80,
  relationship:  70,
  personal:      60,
  social:        50,
  routine:       30,
};

// ---------------------------------------------------------------------------
// Score sub-components (all return 0–100)
// ---------------------------------------------------------------------------

/**
 * Calculates how time-sensitive a task is based on its deadline.
 *
 * @param deadline - Optional deadline Date; undefined means no deadline set.
 * @returns A 0–100 urgency score:
 *   - No deadline    → 20  (not urgent but not zero)
 *   - Overdue        → 100
 *   - Within 24 hrs  → 90
 *   - Within 3 days  → 70
 *   - Within 7 days  → 50
 *   - Within 30 days → 30
 *   - Beyond 30 days → 20
 */
function urgencyScore(deadline: Date | undefined): number {
  if (!deadline) return 20;

  const nowMs = Date.now();
  const diffMs = deadline.getTime() - nowMs;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0)   return 100; // overdue
  if (diffDays < 1)   return 90;  // due within 24 hours
  if (diffDays < 3)   return 70;  // due within 3 days
  if (diffDays < 7)   return 50;  // due within 7 days
  if (diffDays < 30)  return 30;  // due within 30 days
  return 20;                       // more than 30 days away
}

/**
 * Maps a task's category to its fixed importance weight.
 *
 * @param category - The task's category string.
 * @returns A 0–100 importance score based on category.
 */
function importanceScore(category: TaskCategory): number {
  return CATEGORY_WEIGHT[category];
}

/**
 * Rewards tasks that have been sitting incomplete for a long time so that
 * old low-priority items gradually surface rather than being buried forever.
 *
 * Formula: min(100, daysSinceCreation × 2)
 * A task created 50+ days ago maxes out at 100.
 *
 * @param createdAt - The Date the task was first created.
 * @returns A 0–100 aging score.
 */
function agingScore(createdAt: Date): number {
  const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.min(100, daysSinceCreation * 2);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculates an overall priority score for a single task using a weighted
 * combination of urgency, importance, and aging.
 *
 * Formula:
 *   score = (urgency × 0.4) + (importance × 0.4) + (aging × 0.2)
 *
 * @param task - The task to score.
 * @returns A number in the range 0–100 (higher = more urgent/important).
 */
export function calculatePriorityScore(task: Task): number {
  const u = urgencyScore(task.deadline);
  const i = importanceScore(task.category);
  const a = agingScore(task.created_at);

  return (u * 0.4) + (i * 0.4) + (a * 0.2);
}

/**
 * Filters out completed tasks, scores all remaining tasks with
 * {@link calculatePriorityScore}, and returns them sorted highest score first.
 *
 * @param tasks - Array of tasks (mixed completion states).
 * @returns A new array of incomplete tasks ordered by descending priority score.
 */
export function sortTasksByPriority(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => !t.is_completed)
    .sort((a, b) => calculatePriorityScore(b) - calculatePriorityScore(a));
}

/**
 * Returns the top 5 highest-priority incomplete tasks.
 * Used for the home screen widget and daily push notification.
 *
 * @param tasks - Array of tasks (mixed completion states).
 * @returns Up to 5 tasks sorted by descending priority score.
 */
export function getTopFiveTasks(tasks: Task[]): Task[] {
  return sortTasksByPriority(tasks).slice(0, 5);
}

/**
 * Groups incomplete tasks by category into a lookup object.
 * Categories with no incomplete tasks are omitted from the result.
 *
 * @param tasks - Array of tasks (mixed completion states).
 * @returns An object keyed by category, e.g. `{ work: [...], health: [...] }`.
 *
 * @example
 * const groups = categorizeTasks(tasks);
 * const healthTasks = groups['health'] ?? [];
 */
export function categorizeTasks(tasks: Task[]): Record<string, Task[]> {
  const incomplete = tasks.filter((t) => !t.is_completed);

  return incomplete.reduce<Record<string, Task[]>>((groups, task) => {
    if (!groups[task.category]) {
      groups[task.category] = [];
    }
    groups[task.category].push(task);
    return groups;
  }, {});
}
