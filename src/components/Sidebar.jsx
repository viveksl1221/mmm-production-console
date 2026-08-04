import { NavLink } from 'react-router-dom';
import mmmLogo from '../assets/mmmlogo.png';
import profilePic from '../assets/profile-vivek.jpg';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/weekly', label: 'Weekly Plan' },
  { to: '/clients', label: 'Clients' },
  { to: '/comments', label: 'Comments' },
];

export default function Sidebar({ shipped, target, showSignOut, onSignOut }) {
  const pct = target ? Math.round((shipped / target) * 100) : 0;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={mmmLogo} alt="Man Made Marketing" className="sidebar-logo" />
        <div className="sidebar-sub">Production Console</div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.label}
          </NavLink>
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
      </div>

      <div className="sidebar-profile">
        <img className="sidebar-avatar" src={profilePic} alt="Vivek S.L" />
        <div className="sidebar-profile-info">
          <div className="sidebar-profile-name">Vivek S.L</div>
          <div className="sidebar-profile-role">Graphic Designer</div>
        </div>
        {showSignOut && (
          <button className="sidebar-signout" onClick={onSignOut} title="Sign out">⏻</button>
        )}
      </div>
    </aside>
  );
}
