import { totalShipped, totalTargets } from '../lib/derived.js';

export default function TopBar({ posts, blogs, onSignOut }) {
  const shipped = totalShipped(posts, blogs);
  const target = totalTargets();
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-title">August Production Console</div>
        <div className="brand-sub">MMM · 6 clients</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div className="topbar-stat">
          <span className="n mono">{shipped}</span><span className="l">/ {target} shipped</span>
        </div>
        <button
          onClick={onSignOut}
          style={{
            fontSize: 11,
            color: '#8A8A8A',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
