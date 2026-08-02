import { CAMPAIGN_MONTH_INDEX, CAMPAIGN_YEAR } from '../data/campaign.js';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CAMPAIGN_LABEL = `${MONTH_NAMES[CAMPAIGN_MONTH_INDEX]} ${CAMPAIGN_YEAR}`;

const COPY = {
  overview: { title: 'Overview', subtitle: `Where ${CAMPAIGN_LABEL} stands, at a glance` },
  weekly: { title: 'Weekly Plan', subtitle: 'Batch cadence, week by week' },
  clients: { title: 'Clients', subtitle: 'Every post and blog, by client' },
};

export default function PageHeader({ active }) {
  const meta = COPY[active];
  return (
    <header className="main-header">
      <h1 className="page-title">{meta.title}</h1>
      <div className="page-subtitle">{meta.subtitle}</div>
    </header>
  );
}
