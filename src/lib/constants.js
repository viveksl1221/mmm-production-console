// Fixed workflow/design constants. Unlike src/data/campaign.js, these
// describe *how the studio operates* (batch cadence, time estimates,
// status pipeline) and don't change from month to month.

export const TIME_MIN = { Static: 25, Carousel: 50, Reel: 75, Blog: 105, Gap: 45 };

export const BATCH_TASK = {
  1: { name: 'Hooks & Captions', detail: "Write copy for the week's full batch, grouped by pillar" },
  2: { name: 'Statics + Carousels', detail: 'Build all static and carousel visuals in one tool session' },
  3: { name: 'Reels', detail: 'Batch the Reel edits and exports' },
  4: { name: 'Blog Creatives', detail: 'Protected day — the longest single-asset lift' },
  5: { name: 'Review & Schedule', detail: 'Client review sends, revisions, scheduling, QA' },
};

export const STATUSES = ['Planned', 'Drafted', 'Sent to Client', 'Scheduled', 'Published'];

export const STATUS_COLOR = {
  Planned: { bg: '#F5F5F5', fg: '#5A5A5A', bd: '#E7E7E7' },
  Drafted: { bg: '#EAF3EB', fg: '#3F7A47', bd: '#CBE0CC' },
  'Sent to Client': { bg: '#FFF1F0', fg: '#C93636', bd: '#FFD1CE' },
  Scheduled: { bg: '#F0F0F0', fg: '#333333', bd: '#D8D8D8' },
  Published: { bg: '#E5F0E6', fg: '#2F5D34', bd: '#B9D8BC' },
};

export function nextStatus(current) {
  const i = STATUSES.indexOf(current);
  return STATUSES[(i + 1) % STATUSES.length];
}

// Daily checklist progress (/today page) — a separate, simpler tracker from
// the content pipeline above. Colors are deliberately reused from
// STATUS_COLOR (Planned/Sent to Client/Published) rather than introducing
// new ones, keeping the palette consistent app-wide.
export const DAILY_STATUS_LABEL = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const DAILY_STATUS_COLOR = {
  not_started: { bg: '#F5F5F5', fg: '#5A5A5A', bd: '#E7E7E7' },
  in_progress: { bg: '#FFF1F0', fg: '#C93636', bd: '#FFD1CE' },
  completed: { bg: '#E5F0E6', fg: '#2F5D34', bd: '#B9D8BC' },
};
