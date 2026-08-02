import { useEffect } from 'react';
import { ALL_CLIENTS, BLOG_TARGETS, CLIENT_NOTES, DATA, POST_TARGETS } from '../data/campaign.js';
import { STATUS_COLOR, nextStatus } from '../lib/constants.js';
import { postKey, slug } from '../lib/derived.js';

function ItemRow({ client, item, status, onStatusChange }) {
  const key = postKey(client, item.num);
  const col = STATUS_COLOR[status];
  return (
    <div className="item-row">
      <div className="item-num mono">{item.num < 100 ? String(item.num).padStart(2, '0') : ''}</div>
      <div className="item-wk">W{item.week > 4 ? 4 : item.week}</div>
      <div className="item-fmt">{item.format}</div>
      <div className="item-text">
        <div className="item-topic">{item.topic}</div>
        <div className="item-hook">{item.hook}</div>
      </div>
      <button
        className="status-btn"
        style={{ background: col.bg, color: col.fg, borderColor: col.bd }}
        onClick={(e) => {
          e.stopPropagation();
          onStatusChange(key, nextStatus(status));
        }}
      >
        <span className="status-dot" style={{ background: col.fg }} />
        {status}
      </button>
    </div>
  );
}

function BlogCounter({ client, blogTarget, blogCount, onBlogChange }) {
  return (
    <div className="blog-block">
      <div className="blog-row">
        <div className="blog-label">Blogs published this month</div>
        <div className="blog-controls">
          <button
            className="blog-btn"
            onClick={(e) => {
              e.stopPropagation();
              onBlogChange(client, Math.max(0, Math.min(blogTarget, blogCount - 1)));
            }}
          >
            −
          </button>
          <div className="blog-count mono">{blogCount} / {blogTarget}</div>
          <button
            className="blog-btn"
            onClick={(e) => {
              e.stopPropagation();
              onBlogChange(client, Math.max(0, Math.min(blogTarget, blogCount + 1)));
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientBlock({ client, posts, blogs, isOpen, onToggle, onStatusChange, onBlogChange }) {
  const items = DATA[client] || [];
  const hasP = POST_TARGETS[client] !== undefined;
  const hasB = BLOG_TARGETS[client] !== undefined;

  let doneCount = 0;
  items.forEach((it) => {
    if ((posts[postKey(client, it.num)] || 'Planned') === 'Published') doneCount++;
  });

  const postTarget = POST_TARGETS[client] || 0;
  const blogTarget = BLOG_TARGETS[client] || 0;
  const blogCount = blogs[client] || 0;
  const totalDone = doneCount + blogCount;
  const totalTarget = postTarget + blogTarget;
  const pct = totalTarget ? Math.round((totalDone / totalTarget) * 100) : 0;

  const metaBits = [];
  if (hasP) metaBits.push(`${items.length}/${postTarget} posts planned`);
  if (hasB) metaBits.push(`${blogTarget} blogs`);

  return (
    <div className={`client-block ${isOpen ? 'open' : ''}`} data-slug={slug(client)}>
      <div className="client-head" onClick={onToggle}>
        <div>
          <div className="client-name">{client}</div>
          <div className="client-meta">{metaBits.join(' · ')}</div>
        </div>
        <div className="wk-right">
          <div className="bar-wrap">
            <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
            <div className="bar-num mono">{totalDone} / {totalTarget} shipped</div>
          </div>
          <div className="chev">▸</div>
        </div>
      </div>
      <div className="client-body">
        {CLIENT_NOTES[client] && <div className="note">{CLIENT_NOTES[client]}</div>}
        {hasB && <BlogCounter client={client} blogTarget={blogTarget} blogCount={blogCount} onBlogChange={onBlogChange} />}
        {items.map((it) => (
          <ItemRow
            key={it.num}
            client={client}
            item={it}
            status={posts[postKey(client, it.num)] || 'Planned'}
            onStatusChange={(key, next) => onStatusChange(client, it.num, next)}
          />
        ))}
      </div>
    </div>
  );
}

export default function ClientsTab({ posts, blogs, setPostStatus, setBlogCount, openClients, setOpenClients, navRequest }) {
  useEffect(() => {
    if (navRequest?.type === 'client') {
      setOpenClients({ [slug(navRequest.client)]: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navRequest]);

  function toggleClient(name) {
    const s = slug(name);
    setOpenClients((prev) => ({ ...prev, [s]: !prev[s] }));
  }

  return (
    <>
      {ALL_CLIENTS.map((client) => (
        <ClientBlock
          key={client}
          client={client}
          posts={posts}
          blogs={blogs}
          isOpen={!!openClients[slug(client)]}
          onToggle={() => toggleClient(client)}
          onStatusChange={setPostStatus}
          onBlogChange={setBlogCount}
        />
      ))}
    </>
  );
}
