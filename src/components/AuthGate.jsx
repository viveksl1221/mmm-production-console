import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSending(true);
    const { error: err } = await supabase.auth.signInWithOtp({ email });
    setSending(false);
    if (err) setError(err.message);
    else setSent(true);
  }

  return (
    <div
      style={{
        maxWidth: 380,
        margin: '80px auto',
        background: '#FFFFFF',
        border: '1px solid #E2E2E2',
        borderRadius: 10,
        padding: '28px 26px',
        fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
        color: '#111111',
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Production Console</div>
      <div style={{ fontSize: 11, color: '#8A8A8A', marginBottom: 20 }}>MMM · sign in to continue</div>

      {sent ? (
        <div style={{ fontSize: 13, color: '#4B7A51' }}>
          Check <b>{email}</b> for a sign-in link.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="you@agency.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 11px',
              fontSize: 13,
              border: '1px solid #E2E2E2',
              borderRadius: 6,
              marginBottom: 12,
              fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            disabled={sending}
            style={{
              width: '100%',
              padding: '10px 11px',
              fontSize: 13,
              fontWeight: 600,
              color: '#FFFFFF',
              background: '#C0392B',
              border: 'none',
              borderRadius: 6,
              cursor: sending ? 'default' : 'pointer',
              opacity: sending ? 0.7 : 1,
            }}
          >
            {sending ? 'Sending…' : 'Send magic link'}
          </button>
          {error && <div style={{ fontSize: 11.5, color: '#C0392B', marginTop: 10 }}>{error}</div>}
        </form>
      )}
    </div>
  );
}
