import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ALL_CLIENTS, BLOG_TARGETS, POST_TARGETS } from '../data/campaign.js';
import { STATUS_COLOR, nextStatus } from '../lib/constants.js';
import { downloadCSV, itemsToCSV } from '../lib/csvExport.js';
import { postKey, slug } from '../lib/derived.js';
import ConfirmDialog from './ConfirmDialog.jsx';

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

function EditableItemRow({ item, status, isOpen, onToggleOpen, onSave, onStatusChange, onRequestRemove }) {
  const col = STATUS_COLOR[status];
  const [draft, setDraft] = useState(item);
  const [dirty, setDirty] = useState(false);

  // Pick up changes from elsewhere (realtime updates from a teammate, or a
  // Discard) as long as this row has no unsaved edits of its own.
  useEffect(() => {
    if (!dirty) setDraft(item);
  }, [item, dirty]);

  function change(patch) {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  }

  function save() {
    onSave(draft);
    setDirty(false);
  }

  function discard() {
    setDraft(item);
    setDirty(false);
  }

  return (
    <div className={`edit-row-wrap ${isOpen ? 'open' : ''} ${dirty ? 'dirty' : ''}`}>
      <div className="edit-row" onClick={onToggleOpen}>
        <div className="item-num mono">{item.num < 100 ? String(item.num).padStart(2, '0') : item.num}</div>

        <select className="edit-select" value={draft.week} onClick={(e) => e.stopPropagation()} onChange={(e) => change({ week: Number(e.target.value) })}>
          {WEEKS.map((w) => (
            <option key={w} value={w}>W{w}</option>
          ))}
        </select>

        <select className="edit-select edit-select-format" value={draft.format} onClick={(e) => e.stopPropagation()} onChange={(e) => change({ format: e.target.value })}>
          {FORMATS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <input
          className="edit-input edit-input-topic"
          type="text"
          placeholder="Topic"
          value={draft.topic}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => change({ topic: e.target.value })}
        />
        <input
          className="edit-input edit-input-hook"
          type="text"
          placeholder="Hook"
          value={draft.hook}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => change({ hook: e.target.value })}
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
            onRequestRemove();
          }}
        >
          ×
        </button>
      </div>

      {isOpen && (
        <div className="edit-detail" onClick={(e) => e.stopPropagation()}>
          <div className="detail-grid">
            <DetailField label="Platform">
              <input className="edit-input" type="text" value={draft.platform} onChange={(e) => change({ platform: e.target.value })} />
            </DetailField>
            <DetailField label="Audience">
              <input className="edit-input" type="text" value={draft.audience} onChange={(e) => change({ audience: e.target.value })} />
            </DetailField>
            <DetailField label="Funnel stage">
              <input className="edit-input" type="text" value={draft.funnel} onChange={(e) => change({ funnel: e.target.value })} />
            </DetailField>
            <DetailField label="Pillar / campaign">
              <input className="edit-input" type="text" value={draft.pillar} onChange={(e) => change({ pillar: e.target.value })} />
            </DetailField>
            <DetailField label="CTA">
              <input className="edit-input" type="text" value={draft.cta} onChange={(e) => change({ cta: e.target.value })} />
            </DetailField>
            <DetailField label="Assignee">
              <input className="edit-input" type="text" value={draft.assignee} onChange={(e) => change({ assignee: e.target.value })} />
            </DetailField>
            <DetailField label="Date">
              <input className="edit-input" type="text" placeholder="e.g. 3 Aug" value={draft.date} onChange={(e) => change({ date: e.target.value })} />
            </DetailField>
            <DetailField label="Slide / Reel breakdown">
              <input className="edit-input" type="text" value={draft.breakdown} onChange={(e) => change({ breakdown: e.target.value })} />
            </DetailField>
            <DetailField label="Visual direction">
              <input className="edit-input" type="text" value={draft.visualDirection} onChange={(e) => change({ visualDirection: e.target.value })} />
            </DetailField>
          </div>
          <DetailField label="Notes">
            <textarea className="edit-textarea" value={draft.notes} onChange={(e) => change({ notes: e.target.value })} />
          </DetailField>
          <DetailField label="References">
            <ReferencesEditor references={draft.references || []} onChange={(refs) => change({ references: refs })} />
          </DetailField>
        </div>
      )}

      {dirty && (
        <div className="row-save-bar" onClick={(e) => e.stopPropagation()}>
          <span className="row-save-label">● Unsaved changes</span>
          <div className="row-save-actions">
            <button className="row-discard-btn" onClick={discard}>Discard</button>
            <button className="row-save-btn" onClick={save}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

function BlogSection({ client, blogTarget, blogCount, onBlogChange }) {
  const pct = blogTarget ? Math.min(100, Math.round((blogCount / blogTarget) * 100)) : 0;
  return (
    <div className="blog-section">
      <div className="blog-hero">
        <div className="blog-hero-num mono">{blogCount}<span className="blog-hero-target">/ {blogTarget}</span></div>
        <div className="blog-hero-label">Blog creatives published this month</div>
        <div className="bar-track blog-hero-bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="blog-controls">
        <button className="blog-btn" onClick={() => onBlogChange(client, Math.max(0, blogCount - 1))}>−</button>
        <button className="blog-btn" onClick={() => onBlogChange(client, Math.min(blogTarget, blogCount + 1))}>+</button>
      </div>
    </div>
  );
}

export default function ClientPage() {
  const { clientSlug } = useParams();
  const { posts, blogs, setPostStatus, setBlogCount, content } = useOutletContext();
  const client = ALL_CLIENTS.find((c) => slug(c) === clientSlug);
  const [openNum, setOpenNum] = useState(null);
  const [pendingRemove, setPendingRemove] = useState(null);

  const items = client ? content.getItems(client) : [];
  const hasP = client ? POST_TARGETS[client] !== undefined : false;
  const hasB = client ? BLOG_TARGETS[client] !== undefined : false;
  const showTabs = hasP && hasB;
  const [section, setSection] = useState(null);
  const activeSection = section || (hasP ? 'posts' : 'blog');

  if (!client) {
    return (
      <div className="empty-state">
        Client not found. <Link to="/clients">Back to Clients</Link>
      </div>
    );
  }

  const blogTarget = BLOG_TARGETS[client] || 0;
  const blogCount = blogs[client] || 0;
  const removeTarget = pendingRemove != null ? items.find((it) => it.num === pendingRemove) : null;

  return (
    <div className="client-page">
      {showTabs && (
        <div className="section-tabs">
          <button className={`section-tab ${activeSection === 'posts' ? 'active' : ''}`} onClick={() => setSection('posts')}>
            Posts <span className="section-tab-count">{items.length}</span>
          </button>
          <button className={`section-tab ${activeSection === 'blog' ? 'active' : ''}`} onClick={() => setSection('blog')}>
            Blog Creatives <span className="section-tab-count">{blogCount}/{blogTarget}</span>
          </button>
        </div>
      )}

      {activeSection === 'blog' && hasB && (
        <BlogSection client={client} blogTarget={blogTarget} blogCount={blogCount} onBlogChange={setBlogCount} />
      )}

      {activeSection === 'posts' && hasP && (
        <>
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
                onSave={(draft) => content.updateItem(client, item.num, draft)}
                onStatusChange={(next) => setPostStatus(client, item.num, next)}
                onRequestRemove={() => setPendingRemove(item.num)}
              />
            ))}
          </div>

          <div className="edit-toolbar">
            <button className="add-post-btn" onClick={() => content.addItem(client)}>+ Add post</button>
            <button
              className="add-post-btn"
              onClick={() => {
                const csv = itemsToCSV([[client, items]], (c, num) => posts[postKey(c, num)] || 'Planned', false);
                downloadCSV(`${slug(client)}-content-calendar.csv`, csv);
              }}
            >
              Export CSV
            </button>
          </div>
        </>
      )}

      {pendingRemove != null && (
        <ConfirmDialog
          title="Remove this post?"
          message={`"${removeTarget?.topic || 'This post'}" will be permanently deleted for ${client}. This can't be undone.`}
          confirmLabel="Remove post"
          onCancel={() => setPendingRemove(null)}
          onConfirm={() => {
            content.removeItem(client, pendingRemove);
            setPendingRemove(null);
          }}
        />
      )}
    </div>
  );
}
