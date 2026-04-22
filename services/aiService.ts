import { Task, TaskCategory } from '../models';

export interface TranscribedTask {
  title: string;
  category: TaskCategory;
  deadline: Date | null;
}

/**
 * Placeholder: will be wired to Whisper (transcription) + GPT-4o (parsing + scoring).
 */
export async function transcribeAudio(_audioUri: string): Promise<string> {
  throw new Error('transcribeAudio: not yet implemented');
}

export async function parseTaskFromText(_text: string): Promise<TranscribedTask> {
  throw new Error('parseTaskFromText: not yet implemented');
}

export async function scorePriority(_task: Omit<Task, 'priorityScore'>): Promise<number> {
  throw new Error('scorePriority: not yet implemented');
}
