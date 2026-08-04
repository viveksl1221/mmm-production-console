import { Link, useLocation, useParams } from 'react-router-dom';
import { ALL_CLIENTS, BLOG_TARGETS, CAMPAIGN_MONTH_INDEX, CAMPAIGN_YEAR, POST_TARGETS } from '../data/campaign.js';
import { CLIENT_LOGOS } from '../lib/clientLogos.js';
import { slug } from '../lib/derived.js';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CAMPAIGN_LABEL = `${MONTH_NAMES[CAMPAIGN_MONTH_INDEX]} ${CAMPAIGN_YEAR}`;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const COPY = {
  '/weekly': { title: 'Weekly Plan', subtitle: 'Batch cadence, week by week' },
  '/clients': { title: 'Clients', subtitle: 'Every post and blog creative, by client' },
};

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function PageHeader({ posts, blogs, content }) {
  const location = useLocation();
  const { clientSlug } = useParams();

  if (clientSlug) {
    const client = ALL_CLIENTS.find((c) => slug(c) === clientSlug);
    const logo = client ? CLIENT_LOGOS[client] : null;
    const items = client && content ? content.getItems(client) : [];
    const postTarget = client ? POST_TARGETS[client] || 0 : 0;
    const blogTarget = client ? BLOG_TARGETS[client] || 0 : 0;

    const metaBits = [];
    if (client && POST_TARGETS[client] !== undefined) metaBits.push(`${items.length}/${postTarget} posts planned`);
    if (client && BLOG_TARGETS[client] !== undefined) metaBits.push(`${blogTarget} blog creatives`);

    return (
      <header className="main-header">
        <Link to="/clients" className="page-breadcrumb">← Clients</Link>
        <div className="client-header-brand">
          {logo && <img className="client-header-logo" src={logo} alt="" />}
          <div>
            <h1 className="page-title">{client || 'Client not found'}</h1>
            <div className="page-subtitle">Content Calendar{metaBits.length ? ` · ${metaBits.join(' · ')}` : ''}</div>
          </div>
        </div>
      </header>
    );
  }

  if (location.pathname === '/today') {
    return (
      <header className="main-header">
        <Link to="/" className="page-breadcrumb">← Overview</Link>
        <h1 className="page-title">{WEEKDAY_NAMES[new Date().getDay()]}'s Batch</h1>
        <div className="page-subtitle">Everything due today, in one checklist</div>
      </header>
    );
  }

  if (location.pathname === '/') {
    return (
      <header className="main-header">
        <h1 className="page-title">{greeting()}, Vivek</h1>
        <div className="page-subtitle">Here's where {CAMPAIGN_LABEL} stands, at a glance</div>
      </header>
    );
  }

  const meta = COPY[location.pathname] || COPY['/weekly'];
  return (
    <header className="main-header">
      <h1 className="page-title">{meta.title}</h1>
      <div className="page-subtitle">{meta.subtitle}</div>
    </header>
  );
}
