import { TaskCategory } from '../models';
import { TaskRow } from './supabaseService';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const CHAT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';
const TEMPERATURE = 0.2; // low temperature → consistent, deterministic output

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface ParsedTask {
  title: string;
  category: TaskCategory;
  deadline: string | null; // ISO 8601 date string e.g. "2025-05-01"
  notes: string | null;
}

export interface PriorityScore {
  id: string;
  score: number;  // 0–100
  reason: string; // one-sentence explanation for the score
}

// Internal shape of a GPT-4o message.
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ---------------------------------------------------------------------------
// Core fetch helper
// ---------------------------------------------------------------------------

/**
 * Sends a chat completion request to GPT-4o and returns the raw response
 * text from the first choice. Always requests JSON output.
 * Throws a descriptive error on non-2xx responses or malformed replies.
 */
async function callGPT(messages: ChatMessage[]): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'OpenAI API key missing. Set EXPO_PUBLIC_OPENAI_API_KEY in your .env file.',
    );
  }

  const response = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: TEMPERATURE,
      response_format: { type: 'json_object' }, // guarantees parseable JSON output
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const json = await response.json();
  const content: string | undefined = json.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }

  return content;
}

/**
 * Parses a JSON string returned by GPT and throws a clear error if it fails.
 */
function parseJSON<T>(raw: string, context: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`${context}: failed to parse GPT response as JSON.\nRaw: ${raw}`);
  }
}

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

const PARSE_TASK_SYSTEM_PROMPT = `
You are a task extraction assistant for a voice-first productivity app.

The user will send you a raw voice transcript (possibly with filler words, hesitations, or informal phrasing) along with today's date.

Extract the following fields and return ONLY a JSON object with no extra text:
- "title": a clean, concise task title (remove filler words, fix grammar)
- "category": one of exactly these values: "work" | "personal" | "health" | "social" | "relationship" | "legal" | "routine"
- "deadline": an ISO 8601 date string (YYYY-MM-DD) inferred from time phrases like "tomorrow", "next Monday", "by Friday", "end of week" — or null if no deadline is mentioned. Use today's date to calculate relative dates.
- "notes": any useful extra context from the transcript that didn't fit in the title (or null if none)

Category selection guidance:
- "health"       → doctor, dentist, medication, exercise, mental health
- "legal"        → contracts, taxes, government forms, legal deadlines
- "work"         → job, meetings, emails, projects, colleagues
- "relationship" → partner, family, close friends
- "social"       → events, outings, acquaintances
- "routine"      → chores, errands, groceries, maintenance
- "personal"     → everything else

Example input: "uh i need to call my doctor sometime tomorrow about my knee"
Example output:
{
  "title": "Call doctor about knee",
  "category": "health",
  "deadline": "2025-04-23",
  "notes": "Follow up about knee issue"
}
`.trim();

const PRIORITIZE_TASKS_SYSTEM_PROMPT = `
You are a prioritization engine for a voice-first AI task manager.

The user will send you a list of incomplete tasks (as JSON) and a short description of their current life context and priorities.

Score each task from 0 to 100 based on these four factors:
1. Time sensitivity     — how close is the deadline? Missing or overdue deadlines score higher.
2. Category importance  — legal(10) > health(9) > work(8) > relationship(7) > personal(6) > social(5) > routine(3)
3. Opportunity cost     — does completing this task likely unblock other things?
4. Life context fit     — how well does this task align with what the user says matters most right now?

Return ONLY a JSON object with a single key "scores" whose value is an array of objects:
[{ "id": "<task id>", "score": <0-100>, "reason": "<one concise sentence>" }]

Every task in the input must appear in the output. Do not add or remove tasks.
`.trim();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses a raw voice transcript into a structured task object.
 *
 * @param rawTranscript - Unedited text returned by Whisper
 * @returns A clean ParsedTask ready to be saved to Supabase
 *
 * @example
 * const task = await parseVoiceTranscript("uh remind me to file my taxes by friday");
 * // → { title: "File taxes", category: "legal", deadline: "2025-04-25", notes: null }
 */
export async function parseVoiceTranscript(rawTranscript: string): Promise<ParsedTask> {
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

  const messages: ChatMessage[] = [
    { role: 'system', content: PARSE_TASK_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Today's date: ${today}\n\nTranscript: "${rawTranscript}"`,
    },
  ];

  const raw = await callGPT(messages);
  const parsed = parseJSON<ParsedTask>(raw, 'parseVoiceTranscript');

  // Guard against the model returning an unexpected category value.
  const validCategories: TaskCategory[] = [
    'work', 'personal', 'health', 'social', 'relationship', 'legal', 'routine',
  ];
  if (!validCategories.includes(parsed.category)) {
    parsed.category = 'personal'; // safe fallback
  }

  return parsed;
}

/**
 * Scores all incomplete tasks 0–100 based on urgency, category weight,
 * opportunity cost, and the user's stated life context.
 *
 * @param tasks       - Full array of incomplete Task objects
 * @param userContext - Free-text life context from the user's profile
 * @returns Array of { id, score, reason } — one entry per input task
 *
 * @example
 * const scores = await prioritizeTasks(tasks, "I'm studying for bar exam, job starts in 3 weeks");
 * // → [{ id: "abc", score: 92, reason: "Legal deadline aligns directly with bar exam prep" }, ...]
 */
export async function prioritizeTasks(
  tasks: TaskRow[],
  userContext: string,
  calendarContext?: string,
): Promise<PriorityScore[]> {
  if (tasks.length === 0) return [];

  // Serialise tasks into a compact, readable format for the model.
  // TaskRow uses snake_case and stores deadline as an ISO string already.
  const taskList = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    category: t.category,
    deadline: t.deadline ?? null,
    notes: t.notes ?? null,
  }));

  const today = new Date().toISOString().split('T')[0];

  const messages: ChatMessage[] = [
    { role: 'system', content: PRIORITIZE_TASKS_SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        `Today's date: ${today}`,
        `User context: ${userContext || 'No context provided.'}`,
        calendarContext ? `\nCalendar context:\n${calendarContext}` : '',
        '',
        'Tasks to score:',
        JSON.stringify(taskList, null, 2),
      ].filter(Boolean).join('\n'),
    },
  ];

  const raw = await callGPT(messages);
  const parsed = parseJSON<{ scores: PriorityScore[] }>(raw, 'prioritizeTasks');

  if (!Array.isArray(parsed.scores)) {
    throw new Error('prioritizeTasks: GPT response did not contain a "scores" array.');
  }

  return parsed.scores;
}
