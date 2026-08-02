import { Link, useLocation, useParams } from 'react-router-dom';
import { ALL_CLIENTS, CAMPAIGN_MONTH_INDEX, CAMPAIGN_YEAR } from '../data/campaign.js';
import { slug } from '../lib/derived.js';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CAMPAIGN_LABEL = `${MONTH_NAMES[CAMPAIGN_MONTH_INDEX]} ${CAMPAIGN_YEAR}`;

const COPY = {
  '/': { title: 'Overview', subtitle: `Where ${CAMPAIGN_LABEL} stands, at a glance` },
  '/weekly': { title: 'Weekly Plan', subtitle: 'Batch cadence, week by week' },
  '/clients': { title: 'Clients', subtitle: 'Every post and blog, by client' },
};

export default function PageHeader() {
  const location = useLocation();
  const { clientSlug } = useParams();

  if (clientSlug) {
    const client = ALL_CLIENTS.find((c) => slug(c) === clientSlug);
    return (
      <header className="main-header">
        <Link to="/clients" className="page-breadcrumb">← Clients</Link>
        <h1 className="page-title">{client || 'Client not found'}</h1>
        <div className="page-subtitle">Add, edit, and track this client's posts and blogs</div>
      </header>
    );
  }

  const meta = COPY[location.pathname] || COPY['/'];
  return (
    <header className="main-header">
      <h1 className="page-title">{meta.title}</h1>
      <div className="page-subtitle">{meta.subtitle}</div>
    </header>
  );
}
