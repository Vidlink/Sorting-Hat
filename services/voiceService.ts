import { Audio } from 'expo-av';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// EXPO_PUBLIC_ prefix is required for Expo to inject the variable into the
// JS bundle at build time. Store your key in .env as EXPO_PUBLIC_OPENAI_API_KEY.
//
// ⚠️  Security note: any EXPO_PUBLIC_ variable is visible inside the compiled
// app bundle. For production, route Whisper requests through your own backend
// so the key is never shipped to end-users.
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const WHISPER_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';

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
 *
 * Returns the live Audio.Recording object — hold on to it and pass it to
 * stopRecording() when the user finishes speaking.
 */
export async function startRecording(): Promise<Audio.Recording> {
  // Put the audio session into recording mode (required on iOS).
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
 *
 * After this call the recording object is unloaded and must not be reused.
 */
export async function stopRecording(recording: Audio.Recording): Promise<string> {
  // Flush audio data and close the encoder.
  await recording.stopAndUnloadAsync();

  // Restore the audio session to playback mode so other sounds work normally.
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  const uri = recording.getURI();
  if (!uri) throw new Error('stopRecording: recording URI is null after stopping.');

  return uri;
}

// ---------------------------------------------------------------------------
// Transcription
// ---------------------------------------------------------------------------

/**
 * Sends a local audio file to the OpenAI Whisper API and returns the
 * transcribed text.
 *
 * @param fileUri - Local file URI returned by stopRecording()
 *
 * The file is sent as multipart/form-data. React Native's fetch supports
 * this natively — no additional library needed.
 */
export async function transcribeAudio(fileUri: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'OpenAI API key missing. Set EXPO_PUBLIC_OPENAI_API_KEY in your .env file.',
    );
  }

  // Derive the file extension from the URI so Whisper knows the codec.
  // expo-av HIGH_QUALITY records as .m4a on both iOS and Android.
  const extension = fileUri.split('.').pop() ?? 'm4a';
  const mimeType = extension === 'mp4' ? 'audio/mp4' : `audio/${extension}`;

  // Build a multipart/form-data body. React Native accepts { uri, name, type }
  // objects inside FormData for local file uploads.
  const body = new FormData();
  body.append('file', {
    uri: fileUri,
    name: `recording.${extension}`,
    type: mimeType,
  } as unknown as Blob);
  body.append('model', 'whisper-1');

  const response = await fetch(WHISPER_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      // Do NOT set Content-Type manually — fetch sets it automatically with
      // the correct boundary string when the body is FormData.
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whisper API error ${response.status}: ${errorText}`);
  }

  const json = (await response.json()) as { text: string };
  return json.text;
}
