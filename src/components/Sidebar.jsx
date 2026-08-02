import mmmLogo from '../assets/mmmlogo.png';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'weekly', label: 'Weekly Plan' },
  { id: 'clients', label: 'Clients' },
];

export default function Sidebar({ active, onChange, shipped, target, showSignOut, onSignOut }) {
  const pct = target ? Math.round((shipped / target) * 100) : 0;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={mmmLogo} alt="Man Made Marketing" className="sidebar-logo" />
        <div className="sidebar-sub">Production Console</div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-stat-row">
          <span className="mono">{shipped}</span>
          <span className="sidebar-stat-total">/ {target} shipped</span>
        </div>
        <div className="bar-track sidebar-bar-track">
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
        {showSignOut && (
          <button className="sidebar-signout" onClick={onSignOut}>Sign out</button>
        )}
      </div>
    </aside>
  );
}
