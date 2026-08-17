// Fixed workflow/design constants. Unlike src/data/campaign.js, these
// describe *how the studio operates* (batch cadence, time estimates,
// status pipeline) and don't change from month to month.

export const TIME_MIN = { Static: 25, Carousel: 50, Reel: 75, Blog: 105, Gap: 45 };

// Monday–Thursday are dynamic per week — one client's full day (see
// clientDayAssignments in derived.js), not a fixed format-based task, so
// there's nothing to hardcode for them. Friday is the one fixed day left:
// a full-week review sweep across every client, not production work.
export const REVIEW_TASK = { name: 'Review & Send', detail: 'Final review, revisions, send for approval, QA' };

// The pipeline stops at Approved — there's no "sent to client"/"scheduled"/
// "published" stage on this side; whatever happens after approval isn't
// tracked here.
export const STATUSES = ['Planned', 'Designed', 'Sent for Approval', 'Approved'];

// Bg/fg/border ramp within the red/black/white palette only — no other
// hues. Progress reads as weight, not color: lightest gray (Planned) to
// solid black fill (Approved), with red reserved for the one state that
// means "waiting on someone else" (the account manager).
export const STATUS_COLOR = {
  Planned: { bg: '#F5F5F5', fg: '#8A8A8A', bd: '#E7E7E7' },
  Designed: { bg: '#F0F0F0', fg: '#4A4A4A', bd: '#D8D8D8' },
  'Sent for Approval': { bg: '#FFF1F0', fg: '#C93636', bd: '#FFD1CE' },
  Approved: { bg: '#171717', fg: '#FFFFFF', bd: '#171717' },
};

export function nextStatus(current) {
  const i = STATUSES.indexOf(current);
  return STATUSES[(i + 1) % STATUSES.length];
}

// Daily checklist progress (/today page) — a separate, simpler tracker from
// the content pipeline above. Colors are deliberately reused from
// STATUS_COLOR (Planned/Sent for Approval/Approved) rather than introducing
// new ones, keeping the palette consistent app-wide.
export const DAILY_STATUS_LABEL = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const DAILY_STATUS_COLOR = {
  not_started: { bg: '#F5F5F5', fg: '#5A5A5A', bd: '#E7E7E7' },
  in_progress: { bg: '#FFF1F0', fg: '#C93636', bd: '#FFD1CE' },
  completed: { bg: '#171717', fg: '#FFFFFF', bd: '#171717' },
};
