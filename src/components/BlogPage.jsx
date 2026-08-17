import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ALL_CLIENTS } from '../data/campaign.js';
import { CLIENT_LOGOS } from '../lib/clientLogos.js';

// One client's blog target/count editor — the same hero-card UI that used
// to live inside each client's own "Blog Creatives" tab, now centralized
// here so blog creative work is fully decoupled from the per-client pages
// (which are otherwise about Static/Carousel/Reel production).
function BlogClientCard({ client, blogTarget, blogCount, onBlogChange, onTargetChange }) {
  const pct = blogTarget ? Math.min(100, Math.round((blogCount / blogTarget) * 100)) : 0;
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState(String(blogTarget));

  function openEdit() {
    setTargetDraft(String(blogTarget));
    setEditingTarget(true);
  }

  function commitTarget() {
    setEditingTarget(false);
    const n = parseInt(targetDraft, 10);
    if (Number.isFinite(n) && n >= 0 && n !== blogTarget) {
      onTargetChange(client, n);
    }
  }

  return (
    <div className="blog-client-card">
      <div className="blog-client-head">
        {CLIENT_LOGOS[client] && <img className="client-logo" src={CLIENT_LOGOS[client]} alt="" />}
        <div className="client-name">{client}</div>
      </div>
      <div className="blog-section">
        <div className="blog-hero">
          <div className="blog-hero-num mono">
            {blogCount}
            {editingTarget ? (
              <input
                type="number"
                min="0"
                className="blog-target-input"
                autoFocus
                value={targetDraft}
                onChange={(e) => setTargetDraft(e.target.value)}
                onBlur={commitTarget}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitTarget();
                  if (e.key === 'Escape') setEditingTarget(false);
                }}
              />
            ) : (
              <button className="blog-hero-target" onClick={openEdit} title="Edit target">/ {blogTarget}</button>
            )}
          </div>
          <div className="blog-hero-label">Blog creatives published this month</div>
          <div className="bar-track blog-hero-bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="blog-controls">
          <button className="blog-btn" onClick={() => onBlogChange(client, Math.max(0, blogCount - 1))}>−</button>
          <button className="blog-btn" onClick={() => onBlogChange(client, Math.min(blogTarget, blogCount + 1))}>+</button>
        </div>
      </div>
    </div>
  );
}

export default function BlogPage() {
  const { blogs, blogTargets, setBlogCount, setBlogTarget } = useOutletContext();
  const clients = ALL_CLIENTS.filter((c) => (blogTargets[c] || 0) > 0);

  if (!clients.length) {
    return <div className="empty-state">No clients have blog creatives set up yet.</div>;
  }

  return (
    <div className="blog-page">
      {clients.map((client) => (
        <BlogClientCard
          key={client}
          client={client}
          blogTarget={blogTargets[client] || 0}
          blogCount={blogs[client] || 0}
          onBlogChange={setBlogCount}
          onTargetChange={setBlogTarget}
        />
      ))}
    </div>
  );
}
