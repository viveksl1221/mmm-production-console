// Pure calculations derived from live post content + status. Originally
// ported from the offline prototype against the static campaign.js DATA;
// now computed from itemsByClient (the Supabase-backed content) so the
// numbers stay accurate as posts are added/edited/imported, not frozen to
// whatever campaign.js looked like at seed time.

import { POST_TARGETS, BLOG_TARGETS, FIKA_GAP, CAMPAIGN_YEAR, CAMPAIGN_MONTH_INDEX } from '../data/campaign.js';
import { TIME_MIN, STATUSES, REVIEW_TASK } from './constants.js';

export function wkBucket(w) {
  return w === 5 ? 4 : w;
}
export function postKey(client, num) {
  return client + '::' + num;
}
export function slug(s) {
  return s.replace(/[^a-z0-9]/gi, '-').toLowerCase();
}
export function fmtHours(min) {
  const total = Math.round(min);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// mm:ss (or h:mm:ss past an hour) for a live-ticking timer readout.
export function fmtClock(sec) {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const mm = String(m).padStart(2, '0');
  const ssPad = String(ss).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ssPad}` : `${m}:${ssPad}`;
}

// A Reel's total production time includes its separate cover creative — the
// cover takes real design time on top of the edit itself, so it's folded in
// here rather than left implicit, everywhere an item's time is estimated.
export function itemTimeMin(format) {
  const base = TIME_MIN[format] || 0;
  return format === 'Reel' ? base + TIME_MIN.ReelCover : base;
}

// Weekly format/client breakdown, computed fresh from live content.
// Shape: { [week]: { Static, Carousel, Reel, clients: { [client]: { Static, Carousel, Reel, total } } } }
export function computeWeekly(itemsByClient) {
  const weekly = {
    1: { Static: 0, Carousel: 0, Reel: 0, clients: {} },
    2: { Static: 0, Carousel: 0, Reel: 0, clients: {} },
    3: { Static: 0, Carousel: 0, Reel: 0, clients: {} },
    4: { Static: 0, Carousel: 0, Reel: 0, clients: {} },
  };
  Object.keys(itemsByClient).forEach((client) => {
    (itemsByClient[client] || []).forEach((it) => {
      const w = wkBucket(it.week);
      if (!weekly[w]) return;
      weekly[w][it.format] = (weekly[w][it.format] || 0) + 1;
      const c = (weekly[w].clients[client] ||= { Static: 0, Carousel: 0, Reel: 0, total: 0 });
      c[it.format] = (c[it.format] || 0) + 1;
      c.total += 1;
    });
  });
  return weekly;
}

// Per-client detail for one week — the "who's doing what" breakdown used by
// the Weekly Plan page. Sorted by post count, busiest client first.
// blogPerWeek is the shape computeBlogPerWeek() returns — see below.
export function weekClientBreakdown(w, itemsByClient, posts, blogPerWeek) {
  const rows = [];
  Object.keys(itemsByClient).forEach((client) => {
    const items = (itemsByClient[client] || []).filter((it) => wkBucket(it.week) === w);
    if (!items.length) return;
    const counts = { Static: 0, Carousel: 0, Reel: 0 };
    let done = 0;
    items.forEach((it) => {
      counts[it.format] = (counts[it.format] || 0) + 1;
      if ((posts[postKey(client, it.num)] || 'Planned') === 'Approved') done++;
    });
    // Every Reel implies its own separate cover creative — mirrored 1:1,
    // not independently statused (see itemTimeMin).
    if (counts.Reel) counts['Reel Cover'] = counts.Reel;
    rows.push({ client, counts, total: items.length, done, blogCount: blogPerWeek?.[w]?.[client] || 0 });
  });
  return rows.sort((a, b) => b.total - a.total);
}

// One-client-per-day batching: ranks each week's active clients by total
// estimated production minutes (Static/Carousel/Reel only — blog creatives
// are a fully separate lane, not part of this rotation) and hands the three
// biggest their own solo day (Mon/Tue/Wed), so a whole day stays one fixed
// mindset instead of context-switching between clients. Everyone else
// (4th-biggest and smaller) shares Thursday. Stable for the whole week —
// computed from what's scheduled, not from progress, so "Monday = Client X"
// doesn't shift as work gets completed mid-week. Friday isn't assigned here;
// it's the fixed Review & Send sweep across every client (see REVIEW_TASK).
export function clientDayAssignments(w, itemsByClient) {
  const workload = [];
  Object.keys(itemsByClient).forEach((client) => {
    const items = (itemsByClient[client] || []).filter((it) => wkBucket(it.week) === w);
    if (!items.length) return;
    const minutes = items.reduce((sum, it) => sum + itemTimeMin(it.format), 0);
    workload.push({ client, minutes });
  });
  workload.sort((a, b) => b.minutes - a.minutes);

  const assignments = { 1: [], 2: [], 3: [], 4: [] };
  workload.forEach(({ client }, i) => {
    const day = i < 3 ? i + 1 : 4;
    assignments[day].push(client);
  });
  return assignments;
}

// Display name/detail for a given weekday, given that week's client-day
// assignments — used by the Today's Batch header, the calendar strip's day
// tabs, and the Weekly Plan schedule so all three stay in sync.
export function dayTaskLabel(weekday, dayAssignments) {
  if (weekday === 5) return REVIEW_TASK;
  const clients = dayAssignments?.[weekday] || [];
  if (!clients.length) return { name: 'Open day', detail: 'No client work scheduled for this day.' };
  return {
    name: clients.join(' + '),
    detail: clients.length > 1
      ? `Batch the remaining work for ${clients.join(' and ')} — smaller clients sharing the day.`
      : `Batch all of ${clients[0]}'s remaining Static/Carousel/Reel work in one sitting.`,
  };
}

// Merges live per-client target overrides (from blog_counts.target — see
// useProductionState) on top of the campaign.js defaults. This is the
// "effective" target used everywhere a blog target is displayed or used
// for scheduling math, so raising a client's target in the UI propagates
// consistently instead of only affecting the counter it was edited from.
export function effectiveBlogTargets(blogTargetOverrides) {
  const merged = { ...BLOG_TARGETS };
  Object.keys(blogTargetOverrides || {}).forEach((client) => {
    if (blogTargetOverrides[client] != null) merged[client] = blogTargetOverrides[client];
  });
  return merged;
}

// Splits each client's effective monthly blog target evenly across the 4
// weeks — {1:{client:count},2:{...},3:{...},4:{...}}. Recomputed from
// live targets rather than a static module-level constant so a raised
// target reflows the week-by-week scheduling too, not just the total.
export function computeBlogPerWeek(blogTargets) {
  const perWeek = { 1: {}, 2: {}, 3: {}, 4: {} };
  Object.keys(blogTargets).forEach((client) => {
    const target = blogTargets[client];
    const base = Math.floor(target / 4);
    let rem = target - base * 4;
    for (let w = 1; w <= 4; w++) {
      perWeek[w][client] = base + (rem > 0 ? 1 : 0);
      if (rem > 0) rem--;
    }
  });
  return perWeek;
}

export function weekBlogTotal(w, blogPerWeek) {
  return Object.values(blogPerWeek?.[w] || {}).reduce((a, b) => a + b, 0);
}
export function weekPostTotal(w, weeklyData) {
  const f = weeklyData[w];
  return (f.Static || 0) + (f.Carousel || 0) + (f.Reel || 0) + (FIKA_GAP[w] || 0);
}
export function weekTarget(w, weeklyData, blogPerWeek) {
  return weekPostTotal(w, weeklyData) + weekBlogTotal(w, blogPerWeek);
}
export function weekMinutes(w, weeklyData, blogPerWeek) {
  const f = weeklyData[w];
  let m = (f.Static || 0) * TIME_MIN.Static + (f.Carousel || 0) * TIME_MIN.Carousel + (f.Reel || 0) * itemTimeMin('Reel');
  m += weekBlogTotal(w, blogPerWeek) * TIME_MIN.Blog;
  m += (FIKA_GAP[w] || 0) * TIME_MIN.Gap;
  return m;
}

export function weekDone(w, itemsByClient, posts) {
  let done = 0;
  Object.keys(itemsByClient).forEach((client) => {
    (itemsByClient[client] || []).forEach((it) => {
      if (wkBucket(it.week) !== w) return;
      if (posts[postKey(client, it.num)] === 'Approved') done++;
    });
  });
  return done;
}

// Items remaining, broken out by category — posts by format (not yet
// Approved), blog creatives (target minus approved count per client), and
// "not yet planned" for target slots with no post created yet at all (e.g.
// Fika Time's open weeks) — those have no format to bucket into, but still
// count toward the total so this breakdown sums to the same number as the
// plain target-based "items remaining" stat.
export function remainingBreakdown(itemsByClient, posts, blogs, blogTargets) {
  const counts = { Carousel: 0, Static: 0, Reel: 0 };
  Object.keys(itemsByClient).forEach((client) => {
    (itemsByClient[client] || []).forEach((it) => {
      const status = posts[postKey(client, it.num)] || 'Planned';
      if (status !== 'Approved') {
        counts[it.format] = (counts[it.format] || 0) + 1;
      }
    });
  });

  let notYetPlanned = 0;
  Object.keys(POST_TARGETS).forEach((client) => {
    const have = (itemsByClient[client] || []).length;
    notYetPlanned += Math.max(0, POST_TARGETS[client] - have);
  });

  let blogRemaining = 0;
  Object.keys(blogTargets).forEach((client) => {
    blogRemaining += Math.max(0, blogTargets[client] - (blogs[client] || 0));
  });

  // Every not-yet-Approved Reel implies its cover creative isn't done
  // either — mirrored 1:1, not independently statused.
  if (counts.Reel) counts['Reel Cover'] = counts.Reel;

  return { ...counts, 'Not Yet Planned': notYetPlanned, 'Blog Creative': blogRemaining };
}

// Per-client format + status breakdown for the Overview dashboard's
// expandable client cards — "how many Reels/Carousels/Statics, and how far
// along is each" for one client, without navigating into its full page.
export function clientDetailBreakdown(client, items, posts, blogCount, blogTarget) {
  const formats = {};
  const statuses = {};
  STATUSES.forEach((s) => (statuses[s] = 0));

  items.forEach((it) => {
    const fmt = it.format || 'Other';
    formats[fmt] ||= { total: 0, done: 0 };
    formats[fmt].total++;

    const status = posts[postKey(client, it.num)] || 'Planned';
    statuses[status] = (statuses[status] || 0) + 1;
    if (status === 'Approved') formats[fmt].done++;
  });

  // Every Reel implies its own separate cover creative — mirrored 1:1, not
  // independently statused (see itemTimeMin).
  if (formats.Reel) formats['Reel Cover'] = { ...formats.Reel };

  return { formats, statuses, blogCount, blogTarget };
}

export function totalTargets(blogTargets) {
  let t = 0;
  Object.values(POST_TARGETS).forEach((v) => (t += v));
  Object.values(blogTargets).forEach((v) => (t += v));
  return t;
}

export function totalShipped(posts, blogs) {
  let n = 0;
  Object.values(posts).forEach((s) => {
    if (s === 'Approved') n++;
  });
  Object.values(blogs).forEach((c) => {
    n += c || 0;
  });
  return n;
}

export function getTodayInfo() {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();
  const weekday = now.getDay();
  let weekNum = null;
  if (year === CAMPAIGN_YEAR && month === CAMPAIGN_MONTH_INDEX) {
    if (day <= 9) weekNum = 1;
    else if (day <= 16) weekNum = 2;
    else if (day <= 23) weekNum = 3;
    else weekNum = 4;
  }
  const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { weekday, weekNum, dateStr: now.toDateString(), isoDate };
}

// The individual items due for today's batch task, grouped by client.
// Mon–Thu are client-scoped (see clientDayAssignments — whichever client(s)
// have that day, every format of theirs); Friday is the full-week Review &
// Send sweep across every client. dayAssignments is optional — pass it in
// when the caller already computed it for the week (e.g. to render several
// days off one assignment), otherwise it's derived here.
export function todaysItems(itemsByClient, weekNum, weekday, dayAssignments) {
  if (!weekNum || weekday === 0 || weekday === 6) return [];
  const assignments = weekday >= 1 && weekday <= 4 ? (dayAssignments || clientDayAssignments(weekNum, itemsByClient)) : null;
  const clientFilter = assignments ? new Set(assignments[weekday] || []) : null; // null = every client (Friday)
  const rows = [];
  Object.keys(itemsByClient).forEach((client) => {
    if (clientFilter && !clientFilter.has(client)) return;
    (itemsByClient[client] || []).forEach((it) => {
      if (wkBucket(it.week) !== weekNum) return;
      rows.push({ client, item: it, timeMin: itemTimeMin(it.format) });
    });
  });
  return rows.sort((a, b) => a.client.localeCompare(b.client) || a.item.num - b.item.num);
}

// Done/in-progress/pending/total counts for today's checklist, shared by
// the full /today page and the compact Overview card so both read the same
// numbers off the same daily_progress state. progressByKey is keyed
// "workDate::client::num" (see useDailyProgress), so isoDate is required to
// look today's rows up correctly. Blog creatives are a separate lane (their
// own tab per client) and never appear in this daily checklist.
export function todaysCounts(itemsByClient, weekNum, weekday, isoDate, progressByKey, dayAssignments) {
  const postRows = todaysItems(itemsByClient, weekNum, weekday, dayAssignments);
  const statuses = postRows.map((r) => progressByKey[`${isoDate}::${r.client}::${r.item.num}`]?.status || 'not_started');
  return {
    total: statuses.length,
    done: statuses.filter((s) => s === 'completed').length,
    inProgress: statuses.filter((s) => s === 'in_progress').length,
    pending: statuses.filter((s) => s === 'not_started').length,
  };
}

function toIso(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

// The day-of-month each week bucket (see getTodayInfo) starts on — matches
// WEEK_RANGES' start labels (Aug 1/10/17/24).
const WEEK_START_DAY = { 1: 1, 2: 10, 3: 17, 4: 24 };

// Real calendar ISO date for a given (weekNum, weekday) pair, e.g. "which
// date is Wednesday of Week 2" — lets the calendar strip work ahead of or
// review behind the real today, independent of what day it actually is.
export function isoDateForWeekday(weekNum, weekday) {
  const startDate = new Date(CAMPAIGN_YEAR, CAMPAIGN_MONTH_INDEX, WEEK_START_DAY[weekNum]);
  const startDow = startDate.getDay(); // 0=Sun..6=Sat
  const daysUntilMonday = (8 - startDow) % 7;
  const monday = new Date(startDate);
  monday.setDate(startDate.getDate() + daysUntilMonday);
  monday.setDate(monday.getDate() + (weekday - 1));
  return toIso(monday);
}

// [start, end] ISO bounds of the whole campaign month — used to fetch a
// month's worth of daily_progress in one query so any day can be browsed
// and acted on ahead of time, not just the current week.
export function campaignMonthBounds() {
  const start = new Date(CAMPAIGN_YEAR, CAMPAIGN_MONTH_INDEX, 1);
  const end = new Date(CAMPAIGN_YEAR, CAMPAIGN_MONTH_INDEX + 1, 0);
  return { start: toIso(start), end: toIso(end) };
}

// {weekday, isoDate} for each weekday from Monday of this week through (but
// not including) today — the days carriedOverRows checks for unfinished work.
function weekdaysBeforeToday(isoDate, weekday) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const today = new Date(y, m - 1, d);
  const out = [];
  for (let wd = 1; wd < weekday; wd++) {
    const past = new Date(today);
    past.setDate(today.getDate() - (weekday - wd));
    out.push({ weekday: wd, isoDate: `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}` });
  }
  return out;
}

// Items scheduled on an earlier day this week whose progress on THAT
// specific day never reached completed — the safety net for "I didn't
// finish Monday's client." Every Mon–Thu is now a real per-client
// production day (see clientDayAssignments), so all of them count as a due
// day, unlike the old format-batch model where Monday was just a copy pass.
// Dedupes against whatever's already in today's own list so nothing doubles
// up on Friday, which naturally re-sweeps everything anyway. Blog creatives
// aren't day-scheduled at all, so they're never carried over here.
export function carriedOverRows(itemsByClient, weekNum, weekday, isoDate, progressByKey, dayAssignments) {
  if (!weekNum || weekday === 0 || weekday === 6) return [];
  const assignments = dayAssignments || clientDayAssignments(weekNum, itemsByClient);

  const todayKeys = new Set();
  todaysItems(itemsByClient, weekNum, weekday, assignments).forEach((r) => todayKeys.add(`${r.client}::${r.item.num}`));

  const rows = [];
  weekdaysBeforeToday(isoDate, weekday).forEach(({ weekday: wd, isoDate: dueDate }) => {
    const postRows = todaysItems(itemsByClient, weekNum, wd, assignments);
    postRows.forEach((r) => {
      const itemKey = `${r.client}::${r.item.num}`;
      if (todayKeys.has(itemKey)) return;
      const status = progressByKey[`${dueDate}::${itemKey}`]?.status || 'not_started';
      if (status === 'completed') return;
      rows.push({ client: r.client, item: r.item, timeMin: r.timeMin, dueWeekday: wd, dueDate });
    });
  });
  return rows;
}
