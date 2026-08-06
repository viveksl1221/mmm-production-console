// MMM Production Console — AI assistant proxy
//
// Why this exists: the frontend can never hold a real AI API key (anything
// shipped to the browser is public, full stop) — so this Edge Function
// holds the key server-side and the browser calls this instead of the AI
// provider directly. Currently unconfigured (no ANTHROPIC_API_KEY secret
// set yet) — the chat page shows a "not configured" state until it is.
//
// ── One-time setup, once you have an Anthropic API key ──────────────────
// Option A — Supabase Dashboard (no CLI needed):
//   1. Project → Edge Functions → Create a new function → name it "chat".
//   2. Paste this file's contents in as the function code, then Deploy.
//   3. Project → Edge Functions → Secrets → add ANTHROPIC_API_KEY = sk-…
//
// Option B — Supabase CLI:
//   1. npm install -g supabase
//   2. supabase login
//   3. supabase link --project-ref <your-project-ref>
//   4. supabase secrets set ANTHROPIC_API_KEY=sk-…
//   5. supabase functions deploy chat
//
// Nothing else in the app needs to change — src/hooks/useChat.js already
// calls this function by name via supabase.functions.invoke('chat', ...).
// ──────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = [
  "You are the assistant embedded in MMM Production Console, a content-production tracker for a marketing agency's monthly client calendar.",
  'The person chatting with you is the graphic designer running production. Help them plan, prioritize, batch similar work, and draft captions/hooks for reels, statics, and carousels.',
  "If they paste a YAML task list (from the app's 'Copy Summary for AI' button), treat it as their real, current workload — prioritize P1 (carried over/overdue) above P2, and use the `content` block on each task (hook/audience/funnel/pillar/cta/visual_style/structure) as the creative brief.",
  'Be concise and practical — this is a working tool, not a general-purpose chatbot.',
].join('\n');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'not_configured', message: 'ANTHROPIC_API_KEY is not set for this project yet.' }),
      { status: 501, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'bad_request', message: 'Expected JSON body.' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: 'bad_request', message: 'messages[] is required.' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return new Response(JSON.stringify({ error: 'upstream_error', message: errText }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const data = await anthropicRes.json();
    const reply = data.content?.[0]?.text ?? '';
    return new Response(JSON.stringify({ reply }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'server_error', message: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
