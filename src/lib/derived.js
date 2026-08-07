// Pure calculations derived from live post content + status. Originally
// ported from the offline prototype against the static campaign.js DATA;
// now computed from itemsByClient (the Supabase-backed content) so the
// numbers stay accurate as posts are added/edited/imported, not frozen to
// whatever campaign.js looked like at seed time.

import { POST_TARGETS, BLOG_TARGETS, FIKA_GAP, CAMPAIGN_YEAR, CAMPAIGN_MONTH_INDEX } from '../data/campaign.js';
import { TIME_MIN } from './constants.js';

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
export function weekClientBreakdown(w, itemsByClient, posts) {
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
    rows.push({ client, counts, total: items.length, done, blogCount: (BLOG_TARGETS[client] !== undefined ? weekBlogTotalForClient(w, client) : 0) });
  });
  return rows.sort((a, b) => b.total - a.total);
}

// Ranks clients by volume of work matching `formats` within week w — biggest
// batch first, so the batch-schedule view can say who to tackle first on a
// given day (e.g. Tuesday = Static + Carousel).
export function dayFormatPriority(w, itemsByClient, formats) {
  const counts = {};
  Object.keys(itemsByClient).forEach((client) => {
    (itemsByClient[client] || []).forEach((it) => {
      if (wkBucket(it.week) !== w) return;
      if (!formats.includes(it.format)) return;
      counts[client] = (counts[client] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([client, count]) => ({ client, count }))
    .sort((a, b) => b.count - a.count);
}

export const blogPerWeek = { 1: {}, 2: {}, 3: {}, 4: {} };
Object.keys(BLOG_TARGETS).forEach((client) => {
  const target = BLOG_TARGETS[client];
  const base = Math.floor(target / 4);
  let rem = target - base * 4;
  for (let w = 1; w <= 4; w++) {
    blogPerWeek[w][client] = base + (rem > 0 ? 1 : 0);
    if (rem > 0) rem--;
  }
});

function weekBlogTotalForClient(w, client) {
  return blogPerWeek[w][client] || 0;
}

export function weekBlogTotal(w) {
  return Object.values(blogPerWeek[w]).reduce((a, b) => a + b, 0);
}
export function weekPostTotal(w, weeklyData) {
  const f = weeklyData[w];
  return (f.Static || 0) + (f.Carousel || 0) + (f.Reel || 0) + (FIKA_GAP[w] || 0);
}
export function weekTarget(w, weeklyData) {
  return weekPostTotal(w, weeklyData) + weekBlogTotal(w);
}
export function weekMinutes(w, weeklyData) {
  const f = weeklyData[w];
  let m = (f.Static || 0) * TIME_MIN.Static + (f.Carousel || 0) * TIME_MIN.Carousel + (f.Reel || 0) * TIME_MIN.Reel;
  m += weekBlogTotal(w) * TIME_MIN.Blog;
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
export function remainingBreakdown(itemsByClient, posts, blogs) {
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
  Object.keys(BLOG_TARGETS).forEach((client) => {
    blogRemaining += Math.max(0, BLOG_TARGETS[client] - (blogs[client] || 0));
  });

  return { ...counts, 'Not Yet Planned': notYetPlanned, 'Blog Creative': blogRemaining };
}

export function totalTargets() {
  let t = 0;
  Object.values(POST_TARGETS).forEach((v) => (t += v));
  Object.values(BLOG_TARGETS).forEach((v) => (t += v));
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
// Monday (all formats) and Friday (review) both cover the week's full set;
// Tuesday/Wednesday are format-filtered. Thursday has no item list — blog
// creatives aren't individually tracked — see todaysBlogTasks instead.
export function todaysItems(itemsByClient, weekNum, weekday) {
  if (!weekNum || weekday === 0 || weekday === 6 || weekday === 4) return [];
  const formats = weekday === 2 ? ['Static', 'Carousel'] : weekday === 3 ? ['Reel'] : null; // null = all formats (Mon/Fri)
  const rows = [];
  Object.keys(itemsByClient).forEach((client) => {
    (itemsByClient[client] || []).forEach((it) => {
      if (wkBucket(it.week) !== weekNum) return;
      if (formats && !formats.includes(it.format)) return;
      rows.push({ client, item: it, timeMin: TIME_MIN[it.format] || 0 });
    });
  });
  return rows.sort((a, b) => a.client.localeCompare(b.client) || a.item.num - b.item.num);
}

// Thursday only: per-client blog creative counts due this week (no
// individual item records exist for blogs, so this is count-based).
export function todaysBlogTasks(weekNum) {
  if (!weekNum || !blogPerWeek[weekNum]) return [];
  return Object.entries(blogPerWeek[weekNum])
    .filter(([, count]) => count > 0)
    .map(([client, count]) => ({ client, count, timeMin: count * TIME_MIN.Blog }))
    .sort((a, b) => b.count - a.count);
}

// Blog rows have no individual post record to key off of, so they get a
// synthetic client string ("Blog: My Health") with num=0 in daily_progress —
// keeps `num` a valid integer for the DB while staying unique per client.
export function blogProgressKey(client) {
  return `Blog: ${client}`;
}

// Done/in-progress/pending/total counts for today's checklist, shared by
// the full /today page and the compact Overview card so both read the same
// numbers off the same daily_progress state. progressByKey is keyed
// "workDate::client::num" (see useDailyProgress), so isoDate is required to
// look today's rows up correctly.
export function todaysCounts(itemsByClient, weekNum, weekday, isoDate, progressByKey) {
  const isBlogDay = weekday === 4;
  const postRows = isBlogDay ? [] : todaysItems(itemsByClient, weekNum, weekday);
  const blogRows = isBlogDay ? todaysBlogTasks(weekNum) : [];

  const statuses = [
    ...postRows.map((r) => progressByKey[`${isoDate}::${r.client}::${r.item.num}`]?.status || 'not_started'),
    ...blogRows.map((r) => progressByKey[`${isoDate}::${blogProgressKey(r.client)}::0`]?.status || 'not_started'),
  ];
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
// finish Tuesday's Carousel batch." Only Tuesday/Wednesday/Thursday count
// as a real "due day" per format — Monday is a copy pass and Friday a
// review pass over the *whole* week's items regardless of format, so
// treating either as a per-item deadline would flag e.g. a Reel as overdue
// on Tuesday when its actual production day (Wednesday) hasn't happened
// yet. Dedupes against whatever's already in today's own list so nothing
// doubles up on Friday, which naturally re-sweeps everything anyway.
export function carriedOverRows(itemsByClient, weekNum, weekday, isoDate, progressByKey) {
  if (!weekNum || weekday === 0 || weekday === 6) return [];

  const todayKeys = new Set();
  const isBlogDayToday = weekday === 4;
  (isBlogDayToday ? [] : todaysItems(itemsByClient, weekNum, weekday)).forEach((r) => todayKeys.add(`${r.client}::${r.item.num}`));
  (isBlogDayToday ? todaysBlogTasks(weekNum) : []).forEach((r) => todayKeys.add(`${blogProgressKey(r.client)}::0`));

  const rows = [];
  weekdaysBeforeToday(isoDate, weekday).forEach(({ weekday: wd, isoDate: dueDate }) => {
    if (wd === 1) return; // Monday's copy pass isn't a per-format production deadline
    const isBlogDay = wd === 4;
    const postRows = isBlogDay ? [] : todaysItems(itemsByClient, weekNum, wd);
    const blogRows = isBlogDay ? todaysBlogTasks(weekNum) : [];

    postRows.forEach((r) => {
      const itemKey = `${r.client}::${r.item.num}`;
      if (todayKeys.has(itemKey)) return;
      const status = progressByKey[`${dueDate}::${itemKey}`]?.status || 'not_started';
      if (status === 'completed') return;
      rows.push({ client: r.client, item: r.item, timeMin: r.timeMin, dueWeekday: wd, dueDate });
    });

    blogRows.forEach((r) => {
      const itemKey = `${blogProgressKey(r.client)}::0`;
      if (todayKeys.has(itemKey)) return;
      const status = progressByKey[`${dueDate}::${itemKey}`]?.status || 'not_started';
      if (status === 'completed') return;
      rows.push({ client: r.client, count: r.count, timeMin: r.timeMin, isBlog: true, dueWeekday: wd, dueDate });
    });
  });
  return rows;
}
