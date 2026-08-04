import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useComments } from '../hooks/useComments.js';
import { getSavedCommentName, saveCommentName } from '../lib/commentPrefs.js';

// A slim tab pinned to the right edge that slides out a minimal comment
// box — same trigger at every screen width, rather than only appearing
// in leftover space on very wide monitors. The full history/thread lives
// on the /comments page; this just posts and confirms.
export default function FeedbackWidget({ userId }) {
  const { comments, addComment } = useComments(userId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(getSavedCommentName);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justPosted, setJustPosted] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const canSubmit = name.trim() && message.trim() && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    saveCommentName(name.trim());
    await addComment(name.trim(), message.trim());
    setMessage('');
    setSubmitting(false);
    setJustPosted(true);
    setTimeout(() => setJustPosted(false), 2500);
  }

  return (
    <>
      <button
        className={`feedback-tab${open ? ' panel-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        Feedback
      </button>

      <div className={`feedback-panel${open ? ' open' : ''}`}>
        <div className="feedback-panel-head">
          <div>
            <div className="feedback-panel-title">Feedback</div>
            <div className="feedback-panel-sub">Notes for the team — visible on the Comments page</div>
          </div>
          <button className="feedback-panel-close" onClick={() => setOpen(false)} title="Close">×</button>
        </div>
        <form className="feedback-panel-form" onSubmit={handleSubmit}>
          <input
            className="edit-input feedback-panel-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={80}
          />
          <textarea
            className="edit-textarea feedback-panel-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Quick thought…"
            maxLength={2000}
          />
          <button className="add-post-btn primary feedback-panel-submit" type="submit" disabled={!canSubmit}>
            {submitting ? 'Posting…' : justPosted ? 'Posted ✓' : 'Post'}
          </button>
        </form>
        <Link to="/comments" className="feedback-panel-link" onClick={() => setOpen(false)}>
          {comments.length > 0 ? `${comments.length} comment${comments.length === 1 ? '' : 's'} so far →` : 'View all comments →'}
        </Link>
      </div>
    </>
  );
}
