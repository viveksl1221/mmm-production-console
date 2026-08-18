import { useState } from 'react';
import { Link } from 'react-router-dom';
import { STATUS_COLOR } from '../lib/constants.js';
import { buildCreativePromptJSON } from '../lib/creativePrompt.js';
import { slug } from '../lib/derived.js';
import SummaryPreviewModal from './SummaryPreviewModal.jsx';

function DetailView({ label, value }) {
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      <div className="detail-view-value">{value || '—'}</div>
    </div>
  );
}

// Read-only structured view of a post's full fields — opened from the
// Today's Batch checklist so the details are visible without leaving the
// page. Editing still happens on the client's own page (linked at the
// bottom) to keep that the single place edits are made.
export default function PostDetailModal({ client, item, status, brandKit, onClose }) {
  const col = STATUS_COLOR[status] || STATUS_COLOR.Planned;
  const references = item.references || [];
  const [promptPreview, setPromptPreview] = useState(null);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{item.topic || '(untitled)'}</div>
            <div className="modal-subtitle">{client} · #{item.num} · Week {item.week}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="detail-view-top">
            {item.format && <span className="format-pill">{item.format}</span>}
            <span className="status-pill" style={{ background: col.bg, color: col.fg, borderColor: col.bd }}>
              <span className="status-dot" style={{ background: col.fg }} />
              {status}
            </span>
          </div>

          {item.hook && <div className="detail-view-hook">“{item.hook}”</div>}

          <div className="detail-grid">
            <DetailView label="Platform" value={item.platform} />
            <DetailView label="Audience" value={item.audience} />
            <DetailView label="Funnel stage" value={item.funnel} />
            <DetailView label="Pillar / campaign" value={item.pillar} />
            <DetailView label="CTA" value={item.cta} />
            <DetailView label="Assignee" value={item.assignee} />
            <DetailView label="Date" value={item.date} />
            <DetailView label="Slide / Reel breakdown" value={item.breakdown} />
            <DetailView label="Visual direction" value={item.visualDirection} />
          </div>

          <div className="detail-field">
            <span className="detail-label">Notes</span>
            <div className="detail-view-value detail-view-notes">{item.notes || '—'}</div>
          </div>

          {references.length > 0 && (
            <div className="detail-field">
              <span className="detail-label">References</span>
              <div className="detail-view-refs">
                {references.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noreferrer" className="detail-view-ref">
                    {r.label || r.url}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="detail-view-actions">
            <Link to={`/clients/${slug(client)}`} className="detail-view-edit-link" onClick={onClose}>
              Edit in Clients →
            </Link>
            <button
              className="copy-ai-btn"
              onClick={() => setPromptPreview(buildCreativePromptJSON(client, item, brandKit))}
            >
              Copy AI Prompt (JSON) →
            </button>
          </div>
        </div>
      </div>

      {promptPreview && (
        <SummaryPreviewModal
          text={promptPreview}
          title={`AI Prompt — #${item.num} ${item.topic || ''}`.trim()}
          onClose={() => setPromptPreview(null)}
        />
      )}
    </div>
  );
}
