import { useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ALL_CLIENTS, BLOG_TARGETS } from '../data/campaign.js';
import { STATUS_COLOR, nextStatus } from '../lib/constants.js';
import { postKey, slug } from '../lib/derived.js';

const FORMATS = ['Static', 'Carousel', 'Reel'];
const WEEKS = [1, 2, 3, 4, 5];

function DetailField({ label, children }) {
  return (
    <label className="detail-field">
      <span className="detail-label">{label}</span>
      {children}
    </label>
  );
}

function ReferencesEditor({ references, onChange }) {
  function updateRef(i, patch) {
    onChange(references.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeRef(i) {
    onChange(references.filter((_, idx) => idx !== i));
  }
  function addRef() {
    onChange([...references, { label: 'Reference', url: '' }]);
  }

  return (
    <div className="refs-editor">
      {references.map((r, i) => (
        <div className="refs-row" key={i}>
          <input
            className="edit-input refs-label"
            type="text"
            placeholder="Label"
            value={r.label}
            onChange={(e) => updateRef(i, { label: e.target.value })}
          />
          <input
            className="edit-input refs-url"
            type="text"
            placeholder="https://…"
            value={r.url}
            onChange={(e) => updateRef(i, { url: e.target.value })}
          />
          <button className="row-remove" onClick={() => removeRef(i)}>×</button>
        </div>
      ))}
      <button className="add-ref-btn" onClick={addRef}>+ Add link</button>
    </div>
  );
}

function EditableItemRow({ item, status, isOpen, onToggleOpen, onFieldChange, onStatusChange, onRemove }) {
  const col = STATUS_COLOR[status];

  return (
    <div className={`edit-row-wrap ${isOpen ? 'open' : ''}`}>
      <div className="edit-row" onClick={onToggleOpen}>
        <div className="item-num mono">{item.num < 100 ? String(item.num).padStart(2, '0') : item.num}</div>

        <select className="edit-select" value={item.week} onClick={(e) => e.stopPropagation()} onChange={(e) => onFieldChange({ week: Number(e.target.value) })}>
          {WEEKS.map((w) => (
            <option key={w} value={w}>W{w}</option>
          ))}
        </select>

        <select className="edit-select edit-select-format" value={item.format} onClick={(e) => e.stopPropagation()} onChange={(e) => onFieldChange({ format: e.target.value })}>
          {FORMATS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <input
          className="edit-input edit-input-topic"
          type="text"
          placeholder="Topic"
          value={item.topic}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onFieldChange({ topic: e.target.value })}
        />
        <input
          className="edit-input edit-input-hook"
          type="text"
          placeholder="Hook"
          value={item.hook}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onFieldChange({ hook: e.target.value })}
        />

        <button
          className="status-btn"
          style={{ background: col.bg, color: col.fg, borderColor: col.bd }}
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(nextStatus(status));
          }}
        >
          <span className="status-dot" style={{ background: col.fg }} />
          {status}
        </button>

        <div className="row-chev">{isOpen ? '▾' : '▸'}</div>

        <button
          className="row-remove"
          title="Remove post"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      </div>

      {isOpen && (
        <div className="edit-detail" onClick={(e) => e.stopPropagation()}>
          <div className="detail-grid">
            <DetailField label="Platform">
              <input className="edit-input" type="text" value={item.platform} onChange={(e) => onFieldChange({ platform: e.target.value })} />
            </DetailField>
            <DetailField label="Audience">
              <input className="edit-input" type="text" value={item.audience} onChange={(e) => onFieldChange({ audience: e.target.value })} />
            </DetailField>
            <DetailField label="Funnel stage">
              <input className="edit-input" type="text" value={item.funnel} onChange={(e) => onFieldChange({ funnel: e.target.value })} />
            </DetailField>
            <DetailField label="Pillar / campaign">
              <input className="edit-input" type="text" value={item.pillar} onChange={(e) => onFieldChange({ pillar: e.target.value })} />
            </DetailField>
            <DetailField label="CTA">
              <input className="edit-input" type="text" value={item.cta} onChange={(e) => onFieldChange({ cta: e.target.value })} />
            </DetailField>
            <DetailField label="Assignee">
              <input className="edit-input" type="text" value={item.assignee} onChange={(e) => onFieldChange({ assignee: e.target.value })} />
            </DetailField>
            <DetailField label="Date">
              <input className="edit-input" type="text" placeholder="e.g. 3 Aug" value={item.date} onChange={(e) => onFieldChange({ date: e.target.value })} />
            </DetailField>
            <DetailField label="Slide / Reel breakdown">
              <input className="edit-input" type="text" value={item.breakdown} onChange={(e) => onFieldChange({ breakdown: e.target.value })} />
            </DetailField>
            <DetailField label="Visual direction">
              <input className="edit-input" type="text" value={item.visualDirection} onChange={(e) => onFieldChange({ visualDirection: e.target.value })} />
            </DetailField>
          </div>
          <DetailField label="Notes">
            <textarea className="edit-textarea" value={item.notes} onChange={(e) => onFieldChange({ notes: e.target.value })} />
          </DetailField>
          <DetailField label="References">
            <ReferencesEditor references={item.references || []} onChange={(refs) => onFieldChange({ references: refs })} />
          </DetailField>
        </div>
      )}
    </div>
  );
}

function BlogCounter({ client, blogTarget, blogCount, onBlogChange }) {
  return (
    <div className="blog-block">
      <div className="blog-row">
        <div className="blog-label">Blogs published this month</div>
        <div className="blog-controls">
          <button className="blog-btn" onClick={() => onBlogChange(client, Math.max(0, Math.min(blogTarget, blogCount - 1)))}>−</button>
          <div className="blog-count mono">{blogCount} / {blogTarget}</div>
          <button className="blog-btn" onClick={() => onBlogChange(client, Math.max(0, Math.min(blogTarget, blogCount + 1)))}>+</button>
        </div>
      </div>
    </div>
  );
}

export default function ClientPage() {
  const { clientSlug } = useParams();
  const { posts, blogs, setPostStatus, setBlogCount, content } = useOutletContext();
  const client = ALL_CLIENTS.find((c) => slug(c) === clientSlug);
  const [openNum, setOpenNum] = useState(null);

  if (!client) {
    return (
      <div className="empty-state">
        Client not found. <Link to="/clients">Back to Clients</Link>
      </div>
    );
  }

  const items = content.getItems(client);
  const hasB = BLOG_TARGETS[client] !== undefined;
  const blogTarget = BLOG_TARGETS[client] || 0;
  const blogCount = blogs[client] || 0;

  return (
    <div className="client-page">
      {hasB && <BlogCounter client={client} blogTarget={blogTarget} blogCount={blogCount} onBlogChange={setBlogCount} />}

      <div className="edit-list">
        <div className="edit-list-head">
          <span>#</span><span>Week</span><span>Format</span><span>Topic</span><span>Hook</span><span>Status</span><span></span><span></span>
        </div>
        {items.map((item) => (
          <EditableItemRow
            key={item.num}
            item={item}
            status={posts[postKey(client, item.num)] || 'Planned'}
            isOpen={openNum === item.num}
            onToggleOpen={() => setOpenNum(openNum === item.num ? null : item.num)}
            onFieldChange={(patch) => content.updateItem(client, item.num, patch)}
            onStatusChange={(next) => setPostStatus(client, item.num, next)}
            onRemove={() => content.removeItem(client, item.num)}
          />
        ))}
      </div>

      <button className="add-post-btn" onClick={() => content.addItem(client)}>+ Add post</button>
    </div>
  );
}
