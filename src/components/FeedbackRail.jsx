import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useComments } from '../hooks/useComments.js';
import { getSavedCommentName, saveCommentName } from '../lib/commentPrefs.js';

// A minimal always-on comment box docked in the unused space to the right
// of the main content on wide screens — quick feedback capture without
// leaving the page. The full history/thread lives on the /comments page;
// this just posts and confirms.
export default function FeedbackRail({ userId }) {
  const { comments, addComment } = useComments(userId);
  const [name, setName] = useState(getSavedCommentName);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justPosted, setJustPosted] = useState(false);

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
    <aside className="feedback-rail">
      <div className="feedback-rail-title">Feedback</div>
      <div className="feedback-rail-sub">Notes for the team — visible on the Comments page</div>
      <form className="feedback-rail-form" onSubmit={handleSubmit}>
        <input
          className="edit-input feedback-rail-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={80}
        />
        <textarea
          className="edit-textarea feedback-rail-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Quick thought…"
          maxLength={2000}
        />
        <button className="add-post-btn primary feedback-rail-submit" type="submit" disabled={!canSubmit}>
          {submitting ? 'Posting…' : justPosted ? 'Posted ✓' : 'Post'}
        </button>
      </form>
      <Link to="/comments" className="feedback-rail-link">
        {comments.length > 0 ? `${comments.length} comment${comments.length === 1 ? '' : 's'} so far →` : 'View all comments →'}
      </Link>
    </aside>
  );
}
