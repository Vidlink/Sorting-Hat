// Supabase Edge Function — proxies GPT-4o chat completion calls.
// Deploy: supabase functions deploy openai-chat
// Set secret: supabase secrets set OPENAI_API_KEY=sk-...
//
// The client calls this via supabase.functions.invoke('openai-chat', { body: { messages, ... } }).
// Supabase verifies the caller's JWT before invoking (unless --no-verify-jwt is set),
// which gates usage to authenticated users only.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  response_format?: { type: 'json_object' | 'text' };
}

const OPENAI_CHAT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

serve(async (req: Request) => {
  // CORS preflight
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

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonResponse({ error: '`messages` must be a non-empty array' }, 400);
  }

  const openaiResponse = await fetch(OPENAI_CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: body.model ?? 'gpt-4o',
      temperature: body.temperature ?? 0.2,
      messages: body.messages,
      ...(body.response_format ? { response_format: body.response_format } : {}),
    }),
  });

  // Forward OpenAI's response verbatim (preserve status codes + error bodies).
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
