import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { TaskCategory } from '../models';

// ---------------------------------------------------------------------------
// Types — mirror the Supabase table columns (snake_case)
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  name: string;
  job_status: string | null;
  relationship_status: string | null;
  life_context: string | null;
  notification_time: string | null; // stored as "HH:MM" e.g. "08:30"
  created_at: string;
}

export type ProfileInput = Omit<Profile, 'id' | 'created_at'>;

export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  category: TaskCategory;
  deadline: string | null; // ISO 8601
  priority_score: number;
  is_completed: boolean;
  notes: string | null;
  created_at: string;
}

export type TaskInput = Omit<TaskRow, 'id' | 'created_at'>;

// ---------------------------------------------------------------------------
// Client initialisation
// ---------------------------------------------------------------------------

// Expo SDK 49+ exposes variables prefixed with EXPO_PUBLIC_ to the JS bundle.
// Name your .env entries EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

let _client: SupabaseClient | null = null;

/**
 * Initialises the Supabase client once and returns it.
 * Call this early in your app (e.g. inside App.tsx before rendering).
 */
export function initSupabase(): SupabaseClient {
  if (_client) return _client;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase credentials missing. Set EXPO_PUBLIC_SUPABASE_URL and ' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.',
    );
  }

  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // must be false for React Native
      storage: AsyncStorage,     // use AsyncStorage so sessions survive app restarts
    },
  });

  return _client;
}

/** Returns the initialised client, throwing if initSupabase() was never called. */
export function getClient(): SupabaseClient {
  if (!_client) {
    throw new Error('Supabase client not initialised. Call initSupabase() first.');
  }
  return _client;
}

/**
 * Returns the raw Supabase client for direct access.
 * Using a getter ensures callers always receive the live instance, not the
 * initial null that would be captured by a plain `export { _client as supabase }`.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as never)[prop as keyof SupabaseClient];
  },
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function signUpWithEmail(email: string, password: string): Promise<User> {
  const { data, error } = await getClient().auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Sign-up succeeded but no user was returned.');
  return data.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Sign-in succeeded but no user was returned.');
  return data.user;
}

export async function signOut(): Promise<void> {
  const { error } = await getClient().auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await getClient().auth.getUser();
  if (error) throw error;
  return data.user;
}

/**
 * Subscribes to auth state changes (sign-in, sign-out, token refresh).
 * Returns the unsubscribe function — call it in a useEffect cleanup.
 *
 * @example
 * useEffect(() => onAuthStateChange((user) => setUser(user)), []);
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  const { data } = getClient().auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function createProfile(userId: string, profileData: ProfileInput): Promise<Profile> {
  const { data, error } = await getClient()
    .from('profiles')
    .insert({ id: userId, ...profileData })
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getClient()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(
  userId: string,
  updates: Partial<ProfileInput>,
): Promise<Profile> {
  const { data, error } = await getClient()
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function createTask(task: TaskInput): Promise<TaskRow> {
  const { data, error } = await getClient()
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data as TaskRow;
}

export async function getTasks(userId: string): Promise<TaskRow[]> {
  const { data, error } = await getClient()
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_completed', false)
    .order('priority_score', { ascending: false });

  if (error) throw error;
  return (data ?? []) as TaskRow[];
}

export async function updateTask(
  taskId: string,
  updates: Partial<Omit<TaskRow, 'id' | 'user_id' | 'created_at'>>,
): Promise<TaskRow> {
  const { data, error } = await getClient()
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data as TaskRow;
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await getClient()
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}
