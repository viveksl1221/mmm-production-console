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
  return (min / 60).toFixed(1) + 'h';
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
      if ((posts[postKey(client, it.num)] || 'Planned') === 'Published') done++;
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
      if (posts[postKey(client, it.num)] === 'Published') done++;
    });
  });
  return done;
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
    if (s === 'Published') n++;
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
  return { weekday, weekNum, dateStr: now.toDateString() };
}
