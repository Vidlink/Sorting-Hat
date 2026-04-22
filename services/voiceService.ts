import { Audio } from 'expo-av';
import { getClient } from './supabaseService';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
//
// Whisper transcription is proxied through the "transcribe-audio" Supabase
// Edge Function, which holds the OpenAI API key as a server-side secret.

const EDGE_FUNCTION_NAME = 'transcribe-audio';

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

/**
 * Requests microphone permission from the OS.
 * Returns true if the user grants access, false otherwise.
 * Always call this before startRecording().
 */
export async function requestPermissions(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

/**
 * Configures the audio session and starts a new recording.
 * Uses HIGH_QUALITY preset (AAC/m4a, 44.1 kHz, stereo).
 */
export async function startRecording(): Promise<Audio.Recording> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );

  return recording;
}

/**
 * Stops an in-progress recording, flushes the audio file to device storage,
 * and returns the local file URI.
 */
export async function stopRecording(recording: Audio.Recording): Promise<string> {
  await recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  const uri = recording.getURI();
  if (!uri) throw new Error('stopRecording: recording URI is null after stopping.');

  return uri;
}

// ---------------------------------------------------------------------------
// Transcription
// ---------------------------------------------------------------------------

interface WhisperResponse {
  text?: string;
  error?: { message: string };
}

/**
 * Sends a local audio file to the transcribe-audio edge function, which
 * forwards it to OpenAI Whisper and returns the transcribed text.
 *
 * @param fileUri - Local file URI returned by stopRecording()
 */
export async function transcribeAudio(fileUri: string): Promise<string> {
  // expo-av HIGH_QUALITY records as .m4a on both iOS and Android.
  const extension = fileUri.split('.').pop() ?? 'm4a';
  const mimeType = extension === 'mp4' ? 'audio/mp4' : `audio/${extension}`;

  // React Native's FormData accepts a { uri, name, type } object for local files.
  const body = new FormData();
  body.append('file', {
    uri: fileUri,
    name: `recording.${extension}`,
    type: mimeType,
  } as unknown as Blob);

  const { data, error } = await getClient().functions.invoke<WhisperResponse>(
    EDGE_FUNCTION_NAME,
    { body },
  );

  if (error) {
    throw new Error(`Edge function error: ${error.message}`);
  }

  if (data?.error) {
    throw new Error(`Whisper API error: ${data.error.message}`);
  }

  if (!data?.text) {
    throw new Error('Whisper returned an empty response.');
  }

  return data.text;
}
