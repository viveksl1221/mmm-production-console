// Pure calculations derived from the campaign data. Ported as-is from the
// offline prototype — only reshaped so `posts`/`blogs` state is passed in
// as arguments instead of read off a shared global object.

import { DATA, POST_TARGETS, BLOG_TARGETS, FIKA_GAP, CAMPAIGN_YEAR, CAMPAIGN_MONTH_INDEX } from '../data/campaign.js';
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

// Weekly format/client breakdown, computed once from the static campaign data.
export const weekly = { 1: { Static: 0, Carousel: 0, Reel: 0, clients: {} }, 2: { Static: 0, Carousel: 0, Reel: 0, clients: {} }, 3: { Static: 0, Carousel: 0, Reel: 0, clients: {} }, 4: { Static: 0, Carousel: 0, Reel: 0, clients: {} } };
Object.keys(POST_TARGETS).forEach((client) => {
  (DATA[client] || []).forEach((it) => {
    const w = wkBucket(it.week);
    weekly[w][it.format] = (weekly[w][it.format] || 0) + 1;
    weekly[w].clients[client] = (weekly[w].clients[client] || 0) + 1;
  });
});

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

export function weekBlogTotal(w) {
  return Object.values(blogPerWeek[w]).reduce((a, b) => a + b, 0);
}
export function weekPostTotal(w) {
  const f = weekly[w];
  return (f.Static || 0) + (f.Carousel || 0) + (f.Reel || 0) + (FIKA_GAP[w] || 0);
}
export function weekTarget(w) {
  return weekPostTotal(w) + weekBlogTotal(w);
}
export function weekMinutes(w) {
  const f = weekly[w];
  let m = (f.Static || 0) * TIME_MIN.Static + (f.Carousel || 0) * TIME_MIN.Carousel + (f.Reel || 0) * TIME_MIN.Reel;
  m += weekBlogTotal(w) * TIME_MIN.Blog;
  m += (FIKA_GAP[w] || 0) * TIME_MIN.Gap;
  return m;
}

export function weekDone(w, posts) {
  let done = 0;
  Object.keys(POST_TARGETS).forEach((client) => {
    (DATA[client] || []).forEach((it) => {
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
