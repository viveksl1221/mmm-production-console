import { useState } from 'react';

// Shows the generated day summary before it goes anywhere, so nothing
// lands on the clipboard unseen — copy is a deliberate second step here.
export default function SummaryPreviewModal({ text, title = 'Summary preview', onClose }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel summary-preview-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <textarea className="summary-preview-text" readOnly value={text} onFocus={(e) => e.target.select()} />
          <div className="modal-actions summary-preview-actions">
            <button className="add-post-btn" onClick={onClose}>Close</button>
            <button className="add-post-btn primary" onClick={handleCopy}>
              {copied ? 'Copied ✓' : 'Copy to Clipboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
