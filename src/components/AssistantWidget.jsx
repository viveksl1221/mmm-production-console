import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useChat } from '../hooks/useChat.js';

function MessageBubble({ role, content }) {
  return (
    <div className={`chat-bubble-row ${role}`}>
      <div className="chat-bubble">
        <div className="chat-bubble-role">{role === 'user' ? 'You' : 'Assistant'}</div>
        <div className="chat-bubble-text">{content}</div>
      </div>
    </div>
  );
}

// A slim tab pinned to the right edge (above the Feedback tab) that slides
// out a compact chat panel — quick access to the assistant from anywhere,
// same trigger pattern as FeedbackWidget. The full thread lives on
// /assistant; this is a lighter, independent conversation for quick asks.
export default function AssistantWidget() {
  const { messages, sending, notConfigured, error, sendMessage, clear } = useChat();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, open]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    sendMessage(input);
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <>
      <button
        className={`assistant-tab${open ? ' panel-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        Assistant
      </button>

      <div className={`assistant-panel${open ? ' open' : ''}`}>
        <div className="feedback-panel-head">
          <div>
            <div className="feedback-panel-title">AI Assistant</div>
            <div className="feedback-panel-sub">Prioritizing, batching, drafting hooks</div>
          </div>
          <button className="feedback-panel-close" onClick={() => setOpen(false)} title="Close">×</button>
        </div>

        <div className="assistant-panel-thread" ref={scrollRef}>
          {messages.length === 0 && !notConfigured && (
            <div className="empty-state chat-empty assistant-panel-empty">
              Ask a quick question, or paste a YAML summary from Today's Batch for full context.
            </div>
          )}

          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}

          {sending && (
            <div className="chat-bubble-row assistant">
              <div className="chat-bubble chat-bubble-typing">
                <div className="chat-bubble-role">Assistant</div>
                <div className="chat-bubble-text chat-typing-dots"><span /><span /><span /></div>
              </div>
            </div>
          )}

          {notConfigured && (
            <div className="chat-notice assistant-panel-notice">
              <div className="chat-notice-title">Not set up yet</div>
              <div className="chat-notice-body">
                Needs an API key wired up first — see <Link to="/assistant" onClick={() => setOpen(false)}>the full page</Link> for setup steps.
              </div>
            </div>
          )}

          {error && <div className="chat-notice chat-notice-error assistant-panel-notice">{error}</div>}
        </div>

        <form className="assistant-panel-input-row" onSubmit={handleSubmit}>
          <textarea
            className="edit-textarea assistant-panel-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the assistant…"
            rows={2}
          />
          <button className="add-post-btn primary assistant-panel-send" type="submit" disabled={!input.trim() || sending}>
            Send
          </button>
        </form>

        <div className="assistant-panel-footer">
          {messages.length > 0 && (
            <button className="chat-clear-btn" onClick={clear}>Clear</button>
          )}
          <Link to="/assistant" className="feedback-panel-link" onClick={() => setOpen(false)}>
            Open full page →
          </Link>
        </div>
      </div>
    </>
  );
}
