// Fixed workflow/design constants. Unlike src/data/campaign.js, these
// describe *how the studio operates* (batch cadence, time estimates,
// status pipeline) and don't change from month to month.

export const TIME_MIN = { Static: 25, Carousel: 50, Reel: 75, Blog: 105, Gap: 45 };

export const BATCH_TASK = {
  1: { name: 'Hooks & Captions', detail: "Write copy for the week's full batch, grouped by pillar" },
  2: { name: 'Statics + Carousels', detail: 'Build all static and carousel visuals in one tool session' },
  3: { name: 'Reels', detail: 'Batch the Reel edits and exports' },
  4: { name: 'Blog Drafts', detail: 'Protected day — the longest single-item lift' },
  5: { name: 'Review & Schedule', detail: 'Client review sends, revisions, scheduling, QA' },
};

export const STATUSES = ['Planned', 'Drafted', 'Sent to Client', 'Scheduled', 'Published'];

export const STATUS_COLOR = {
  Planned: { bg: '#F2F2F2', fg: '#5A5A5A', bd: '#D8D8D8' },
  Drafted: { bg: '#EFF4EF', fg: '#4B7A51', bd: '#CBE0CC' },
  'Sent to Client': { bg: '#FBEAE7', fg: '#C0392B', bd: '#EFC3BB' },
  Scheduled: { bg: '#F0F0F0', fg: '#333333', bd: '#CCCCCC' },
  Published: { bg: '#E9F3EA', fg: '#2F5D34', bd: '#B9D8BC' },
};

export function nextStatus(current) {
  const i = STATUSES.indexOf(current);
  return STATUSES[(i + 1) % STATUSES.length];
}
