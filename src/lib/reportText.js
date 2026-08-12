// Builds a human-readable (not YAML) text report — for a person, not an
// AI — meant to be copy-pasted into an email or doc. See summaryText.js
// for the structured AI-facing version this deliberately doesn't reuse:
// different audience, different shape.

import { WEEK_RANGES } from '../data/campaign.js';
import { fmtHours, postKey, totalShipped, totalTargets, weekClientBreakdown, weekDone, weekMinutes, weekTarget, wkBucket } from './derived.js';

function fmtGeneratedAt() {
  return new Date().toLocaleString([], { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function weekSectionLines(w, itemsByClient, posts, weeklyData, blogPerWeek) {
  const lines = [];
  const r = WEEK_RANGES[w];
  const target = weekTarget(w, weeklyData, blogPerWeek);
  const done = weekDone(w, itemsByClient, posts);

  lines.push(`${r.label.toUpperCase()} (${r.start} – ${r.end})`);
  lines.push(`${done}/${target} shipped · ~${fmtHours(weekMinutes(w, weeklyData, blogPerWeek))} estimated production`);
  lines.push('');

  const rows = weekClientBreakdown(w, itemsByClient, posts, blogPerWeek);
  if (!rows.length) {
    lines.push('No posts scheduled for this week yet.');
    lines.push('');
    return lines;
  }

  rows.forEach((row) => {
    lines.push(`${row.client} — ${row.done}/${row.total} shipped`);
    (itemsByClient[row.client] || [])
      .filter((it) => wkBucket(it.week) === w)
      .sort((a, b) => a.num - b.num)
      .forEach((it) => {
        const status = posts[postKey(row.client, it.num)] || 'Planned';
        lines.push(`  [${it.format}] ${it.topic || '(untitled)'} — ${status}`);
      });
    lines.push('');
  });

  return lines;
}

// scope: 'weekly' | 'monthly'. week is required for 'weekly'.
export function buildReportText({ scope, week, itemsByClient, posts, blogs, weeklyData, blogTargets, blogPerWeek }) {
  const lines = [];

  if (scope === 'weekly') {
    lines.push(`WEEKLY REPORT — ${WEEK_RANGES[week].label}`);
  } else {
    lines.push('MONTHLY REPORT — August 2026');
  }
  lines.push(`Generated ${fmtGeneratedAt()}`);
  lines.push('');

  if (scope === 'weekly') {
    lines.push(...weekSectionLines(week, itemsByClient, posts, weeklyData, blogPerWeek));
  } else {
    lines.push(`OVERALL — ${totalShipped(posts, blogs)}/${totalTargets(blogTargets)} shipped this month`);
    lines.push('');
    [1, 2, 3, 4].forEach((w) => {
      lines.push(...weekSectionLines(w, itemsByClient, posts, weeklyData, blogPerWeek));
    });
  }

  return lines.join('\n').trimEnd();
}
