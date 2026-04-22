import { Task, TaskCategory, createTask } from '../models';

/**
 * In-memory task store — will be replaced with AsyncStorage persistence.
 */
let tasks: Task[] = [];

export function getTasks(): Task[] {
  return [...tasks].sort((a, b) => b.priorityScore - a.priorityScore);
}

export function addTask(title: string, category: TaskCategory = 'personal', deadline: Date | null = null): Task {
  const task = createTask({ title, category, deadline });
  tasks.push(task);
  return task;
}

export function toggleComplete(id: string): void {
  const task = tasks.find((t) => t.id === id);
  if (task) task.isCompleted = !task.isCompleted;
}

export function updatePriorityScore(id: string, score: number): void {
  const task = tasks.find((t) => t.id === id);
  if (task) task.priorityScore = Math.max(0, Math.min(100, score));
}

export function deleteTask(id: string): void {
  tasks = tasks.filter((t) => t.id !== id);
}
