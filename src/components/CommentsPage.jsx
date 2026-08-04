import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog.jsx';
import { useComments } from '../hooks/useComments.js';

const NAME_STORAGE_KEY = 'mmm-comment-author';

function fmtWhen(iso) {
  const d = new Date(iso);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function CommentsPage() {
  const { userId } = useOutletContext();
  const { comments, loading, addComment, removeComment } = useComments(userId);
  const [name, setName] = useState(() => localStorage.getItem(NAME_STORAGE_KEY) || '');
  const [message, setMessage] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim() && message.trim() && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    localStorage.setItem(NAME_STORAGE_KEY, name.trim());
    await addComment(name.trim(), message.trim());
    setMessage('');
    setSubmitting(false);
  }

  return (
    <>
      <form className="comment-form" onSubmit={handleSubmit}>
        <div className="comment-form-row">
          <label className="detail-label">Your name</label>
          <input
            className="edit-input comment-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Prof. Anitha Kumar"
            maxLength={80}
          />
        </div>
        <div className="comment-form-row">
          <label className="detail-label">Message</label>
          <textarea
            className="edit-textarea comment-message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share feedback or thoughts on the current calendar…"
            maxLength={2000}
          />
        </div>
        <button className="add-post-btn primary comment-submit-btn" type="submit" disabled={!canSubmit}>
          {submitting ? 'Posting…' : 'Post comment'}
        </button>
      </form>

      {loading ? (
        <div className="loading-state">Loading…</div>
      ) : comments.length === 0 ? (
        <div className="empty-state">No comments yet — be the first to leave a note.</div>
      ) : (
        <div className="comment-feed">
          {comments.map((c) => (
            <div className="comment-card" key={c.id}>
              <div className="comment-card-head">
                <div>
                  <span className="comment-author">{c.author_name}</span>
                  <span className="comment-when mono">{fmtWhen(c.created_at)}</span>
                </div>
                <button className="row-remove" onClick={() => setPendingDelete(c)} title="Delete comment">×</button>
              </div>
              <div className="comment-message">{c.message}</div>
            </div>
          ))}
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete comment?"
          message={`This will permanently remove ${pendingDelete.author_name}'s comment.`}
          confirmLabel="Delete"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            removeComment(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </>
  );
}
