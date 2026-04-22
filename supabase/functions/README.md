# Supabase Edge Functions

These functions proxy OpenAI calls so the API key never ships inside the mobile
app bundle. The client (React Native) calls them via `supabase.functions.invoke`;
the user's Supabase JWT is automatically attached, gating usage to logged-in
users only.

| Function           | Purpose                             | Called by             |
|--------------------|-------------------------------------|-----------------------|
| `openai-chat`      | GPT-4o chat completions (JSON mode) | `openAIService.ts`    |
| `transcribe-audio` | Whisper speech-to-text              | `voiceService.ts`     |

## First-time setup

1. **Install the Supabase CLI** (one-time):

   ```bash
   npm install -g supabase
   # or on Windows via scoop: scoop install supabase
   ```

2. **Log in and link the project**:

   ```bash
   supabase login
   supabase link --project-ref sugjpukxigmahyndfxaz
   ```

3. **Store the OpenAI key as a secret** (available only to edge functions):

   ```bash
   supabase secrets set OPENAI_API_KEY=sk-proj-...
   ```

4. **Deploy both functions**:

   ```bash
   supabase functions deploy openai-chat
   supabase functions deploy transcribe-audio
   ```

5. **Remove the OpenAI key from your local `.env`** — the client no longer
   needs it.

## Testing

You can invoke a function directly with curl to confirm it's live:

```bash
curl -L -X POST "https://sugjpukxigmahyndfxaz.supabase.co/functions/v1/openai-chat" \
  -H "Authorization: Bearer <a-user-jwt-from-supabase-auth>" \
  -H "Content-Type: application/json" \
  --data '{"messages":[{"role":"user","content":"Say hello in JSON: {\"msg\":\"...\"}"}],"response_format":{"type":"json_object"}}'
```

## Local development

Run functions locally before deploying:

```bash
supabase functions serve openai-chat --env-file ./supabase/functions/.env.local
```

Create `supabase/functions/.env.local` with `OPENAI_API_KEY=sk-...` — this file
is git-ignored and only loaded when running `supabase functions serve`.

## Auth

By default, Supabase verifies the caller's JWT before invoking the function.
To disable this for a specific function (e.g. for a webhook), add it to
`supabase/config.toml`:

```toml
[functions.openai-chat]
verify_jwt = true   # default — leave as-is for authenticated users only
```
