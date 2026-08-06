import { useEffect, useRef, useState } from 'react';
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

export default function ChatPage() {
  const { messages, sending, notConfigured, error, sendMessage, clear } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

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
    <div className="chat-page">
      {messages.length > 0 && (
        <div className="chat-toolbar">
          <button className="chat-clear-btn" onClick={clear}>Clear conversation</button>
        </div>
      )}

      <div className="chat-thread" ref={scrollRef}>
        {messages.length === 0 && !notConfigured && (
          <div className="empty-state chat-empty">
            Ask about prioritizing today's work, drafting hooks, or planning the week. For the best answers, grab the
            YAML from <b>Today's Batch → Copy Summary for AI</b> and paste it in first.
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
          <div className="chat-notice">
            <div className="chat-notice-title">Not set up yet</div>
            <div className="chat-notice-body">
              This assistant needs an Anthropic API key wired up as a Supabase secret before it can reply — see the
              setup steps at the top of <code>supabase/functions/chat/index.ts</code>. Until then, you can still copy
              a YAML summary from Today's Batch and paste it into Claude Code, Claude.ai, or ChatGPT directly, free.
            </div>
          </div>
        )}

        {error && <div className="chat-notice chat-notice-error">{error}</div>}
      </div>

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <textarea
          className="edit-textarea chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the assistant…"
          rows={2}
        />
        <button className="add-post-btn primary chat-send-btn" type="submit" disabled={!input.trim() || sending}>
          Send
        </button>
      </form>
    </div>
  );
}
