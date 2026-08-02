import { useState } from 'react';
import mmmLogo from '../assets/mmmlogo.png';
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#171717',
        fontFamily: "'Inter', Helvetica, Arial, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Brand mark motif — geometric ring from the design-language reference */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-140px',
          right: '-140px',
          width: 340,
          height: 340,
          borderRadius: '50%',
          border: '46px solid #FF4A4A',
        }}
      />

      <div
        style={{
          width: 380,
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '34px 30px',
          color: '#171717',
          boxShadow: '0 20px 60px -20px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        <img src={mmmLogo} alt="Man Made Marketing" style={{ height: 26, marginBottom: 18 }} />
        <div style={{ fontSize: 11, color: '#8A8A8A', marginBottom: 22 }}>Production Console · sign in to continue</div>

        {sent ? (
          <div style={{ fontSize: 13, color: '#3F7A47' }}>
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
                padding: '10px 12px',
                fontSize: 13,
                border: '1px solid #E7E7E7',
                borderRadius: 8,
                marginBottom: 12,
                fontFamily: "'Inter', Helvetica, Arial, sans-serif",
                boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              disabled={sending}
              style={{
                width: '100%',
                padding: '11px 12px',
                fontSize: 13,
                fontWeight: 600,
                color: '#FFFFFF',
                background: '#FF4A4A',
                border: 'none',
                borderRadius: 8,
                cursor: sending ? 'default' : 'pointer',
                opacity: sending ? 0.7 : 1,
              }}
            >
              {sending ? 'Sending…' : 'Send magic link'}
            </button>
            {error && <div style={{ fontSize: 11.5, color: '#FF4A4A', marginTop: 10 }}>{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
