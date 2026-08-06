import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

// Talks to the `chat` Supabase Edge Function (see
// supabase/functions/chat/index.ts) rather than any AI provider directly —
// the browser can never hold a real API key safely. Until that function is
// deployed with ANTHROPIC_API_KEY set, every send resolves to
// notConfigured: true instead of throwing, so the page can show a calm
// "not set up yet" state.
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState(null);

  async function sendMessage(text) {
    const content = text.trim();
    if (!content || sending) return;

    const nextMessages = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setSending(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('chat', {
        body: { messages: nextMessages },
      });

      if (fnError) throw fnError;

      if (data?.error === 'not_configured') {
        setNotConfigured(true);
        return;
      }
      if (data?.error) {
        setError(data.message || 'The assistant hit an error. Try again in a moment.');
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error('Chat request failed:', err);
      setNotConfigured(true);
    } finally {
      setSending(false);
    }
  }

  function clear() {
    setMessages([]);
    setError(null);
    setNotConfigured(false);
  }

  return { messages, sending, notConfigured, error, sendMessage, clear };
}
