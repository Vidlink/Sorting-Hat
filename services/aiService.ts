import { Task, TaskCategory } from '../models';
import { parseVoiceTranscript, ParsedTask } from './openAIService';
import { transcribeAudio as whisperTranscribe } from './voiceService';

export interface TranscribedTask {
  title: string;
  category: TaskCategory;
  deadline: Date | null;
}

/**
 * Transcribes a local audio file URI using OpenAI Whisper.
 * Delegates to voiceService.transcribeAudio.
 */
export async function transcribeAudio(audioUri: string): Promise<string> {
  return whisperTranscribe(audioUri);
}

/**
 * Parses raw transcript text into a structured task using GPT-4o.
 * Delegates to openAIService.parseVoiceTranscript and maps the result
 * to the legacy TranscribedTask shape.
 */
export async function parseTaskFromText(text: string): Promise<TranscribedTask> {
  const parsed: ParsedTask = await parseVoiceTranscript(text);
  return {
    title: parsed.title,
    category: parsed.category,
    deadline: parsed.deadline ? new Date(parsed.deadline) : null,
  };
}

/**
 * Scores a task using the offline priority algorithm.
 * For AI-powered scoring of a full task list, use openAIService.prioritizeTasks.
 */
export async function scorePriority(task: Omit<Task, 'priorityScore'>): Promise<number> {
  const { calculatePriorityScore } = await import('../utils/PriorityAlgorithm');
  return calculatePriorityScore({
    id: task.id,
    title: task.title,
    category: task.category,
    deadline: task.deadline ?? undefined,
    is_completed: task.isCompleted,
    created_at: task.createdAt,
  });
}
