import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ALL_CLIENTS, BLOG_TARGETS, POST_TARGETS } from '../data/campaign.js';
import { STATUS_COLOR, nextStatus } from '../lib/constants.js';
import { postKey, slug } from '../lib/derived.js';

const FORMATS = ['Static', 'Carousel', 'Reel'];
const WEEKS = [1, 2, 3, 4, 5];

function EditableItemRow({ item, status, onFieldChange, onStatusChange, onRemove }) {
  const col = STATUS_COLOR[status];

  return (
    <div className="edit-row">
      <div className="item-num mono">{item.num < 100 ? String(item.num).padStart(2, '0') : item.num}</div>

      <select className="edit-select" value={item.week} onChange={(e) => onFieldChange(item.num, { week: Number(e.target.value) })}>
        {WEEKS.map((w) => (
          <option key={w} value={w}>W{w}</option>
        ))}
      </select>

      <select className="edit-select edit-select-format" value={item.format} onChange={(e) => onFieldChange(item.num, { format: e.target.value })}>
        {FORMATS.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      <input
        className="edit-input edit-input-topic"
        type="text"
        placeholder="Topic"
        value={item.topic}
        onChange={(e) => onFieldChange(item.num, { topic: e.target.value })}
      />
      <input
        className="edit-input edit-input-hook"
        type="text"
        placeholder="Hook"
        value={item.hook}
        onChange={(e) => onFieldChange(item.num, { hook: e.target.value })}
      />

      <button
        className="status-btn"
        style={{ background: col.bg, color: col.fg, borderColor: col.bd }}
        onClick={() => onStatusChange(item.num, nextStatus(status))}
      >
        <span className="status-dot" style={{ background: col.fg }} />
        {status}
      </button>

      <button className="row-remove" title="Remove post" onClick={() => onRemove(item.num)}>×</button>
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
      <div className="draft-banner">
        Edits here are saved to this session only — database sync is coming next.
      </div>

      {hasB && <BlogCounter client={client} blogTarget={blogTarget} blogCount={blogCount} onBlogChange={setBlogCount} />}

      <div className="edit-list">
        <div className="edit-list-head">
          <span>#</span><span>Week</span><span>Format</span><span>Topic</span><span>Hook</span><span>Status</span><span></span>
        </div>
        {items.map((item) => (
          <EditableItemRow
            key={item.num}
            item={item}
            status={posts[postKey(client, item.num)] || 'Planned'}
            onFieldChange={(num, patch) => content.updateItem(client, num, patch)}
            onStatusChange={(num, next) => setPostStatus(client, num, next)}
            onRemove={(num) => content.removeItem(client, num)}
          />
        ))}
      </div>

      <button className="add-post-btn" onClick={() => content.addItem(client)}>+ Add post</button>
    </div>
  );
}
