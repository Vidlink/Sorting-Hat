// Supabase Edge Function — proxies Whisper audio transcription.
// Deploy: supabase functions deploy transcribe-audio
// Set secret: supabase secrets set OPENAI_API_KEY=sk-...
//
// Accepts multipart/form-data with a single "file" field. Forwards the audio
// to Whisper and returns the transcription JSON ({ text: "..." }).

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const WHISPER_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    return jsonResponse(
      { error: 'Server mis-configured: OPENAI_API_KEY secret is not set.' },
      500,
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonResponse({ error: 'Expected multipart/form-data body' }, 400);
  }

  const file = form.get('file');
  if (!(file instanceof File) && !(file instanceof Blob)) {
    return jsonResponse({ error: 'Missing "file" field in form data' }, 400);
  }

  // Re-pack the file into a new FormData bound for OpenAI.
  // We can't forward the original form directly because we need to also append
  // the model field (and potentially other params) in a controlled way.
  const openaiForm = new FormData();
  openaiForm.append('file', file, (file as File).name ?? 'recording.m4a');
  openaiForm.append('model', (form.get('model') as string) ?? 'whisper-1');

  const language = form.get('language');
  if (typeof language === 'string') openaiForm.append('language', language);

  const openaiResponse = await fetch(WHISPER_ENDPOINT, {
    method: 'POST',
    headers: {
      // Do NOT set Content-Type — fetch picks the correct multipart boundary.
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: openaiForm,
  });

  const responseText = await openaiResponse.text();
  return new Response(responseText, {
    status: openaiResponse.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
});

function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
