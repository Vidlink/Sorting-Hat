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
  deadline: Date | null;
  priorityScore: number; // 0–100, computed by AI
  isCompleted: boolean;
  createdAt: Date;
}

export function createTask(overrides: Partial<Task> & { title: string }): Task {
  return {
    id: generateId(),
    title: overrides.title,
    category: overrides.category ?? 'personal',
    deadline: overrides.deadline ?? null,
    priorityScore: overrides.priorityScore ?? 0,
    isCompleted: overrides.isCompleted ?? false,
    createdAt: overrides.createdAt ?? new Date(),
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
