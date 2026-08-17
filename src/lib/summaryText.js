// Builds a YAML summary of one specific day's checklist — meant to be
// copy-pasted into an external AI chat (ChatGPT, Claude, etc.) since this
// app has no API key of its own to call one directly. Structured data
// instead of prose: an LLM can reorder/batch/estimate off real fields
// rather than re-parsing sentences, and it stays scoped to exactly what's
// on screen for the selected day. Hand-rolled rather than pulling in a
// YAML library — the shape here is fixed and small enough not to need one.
//
// Every `tasks` entry — posts and blog-creative counts alike — shares one
// schema so an AI (or a future feature) can sum duration_minutes or group
// by category without special-casing blog rows. `content` only carries
// fields this app actually tracks (hook/audience/funnel/pillar/cta/visual
// direction/structure) — no invented fields like "objective" that we have
// no real data for.

// JSON.stringify's escaping (backslashes, quotes, control chars) happens to
// produce a valid YAML double-quoted scalar, so this is a safe way to quote
// any string without shipping a YAML serializer for one field.
function yStr(s) {
  return JSON.stringify(s ?? '');
}
function yVal(s) {
  return s ? yStr(s) : 'null';
}

function mapStatus(status) {
  if (status === 'completed') return 'done';
  if (status === 'in_progress') return 'in_progress';
  return 'todo';
}

function toSnake(name) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function pushContentBlock(lines, item) {
  lines.push('    content:');
  lines.push(`      hook: ${yVal(item.hook)}`);
  lines.push(`      audience: ${yVal(item.audience)}`);
  lines.push(`      funnel: ${yVal(item.funnel)}`);
  lines.push(`      pillar: ${yVal(item.pillar)}`);
  lines.push(`      cta: ${yVal(item.cta)}`);
  lines.push(`      visual_style: ${yVal(item.visualDirection)}`);
  lines.push(`      structure: ${yVal(item.breakdown)}`);
}

function pushTask(lines, { id, client, category, title, priority, durationMin, status, carriedOver, originallyDue, item }) {
  lines.push(`  - id: ${id}`);
  lines.push(`    client: ${toSnake(client)}`);
  lines.push(`    category: ${category}`);
  lines.push(`    title: ${yStr(title)}`);
  lines.push(`    priority: ${priority}`);
  lines.push(`    duration_minutes: ${durationMin}`);
  lines.push(`    status: ${status}`);
  if (carriedOver) {
    lines.push('    carried_over: true');
    lines.push(`    originally_due: ${originallyDue}`);
  }
  if (item) pushContentBlock(lines, item);
}

// dayLabel: e.g. "Tuesday, Aug 5"; weekLabel: e.g. "Week 1". Blog creatives
// are a separate lane (their own tab per client, not day-scheduled) and
// never appear in this daily checklist summary.
export function buildDaySummaryText({ isoDate, dayLabel, weekLabel, isToday, task, postRows, carried, extraTasks, progressByKey }) {
  const lines = [];
  lines.push('session:');
  lines.push(`  date: ${isoDate}`);
  lines.push(`  day: ${yStr(dayLabel)}`);
  lines.push(`  week: ${yStr(weekLabel)}`);
  lines.push(`  is_today: ${isToday}`);
  lines.push(`  task_type: ${yStr(task.name)}`);
  lines.push('');

  const counters = {};
  const nextId = (category) => {
    counters[category] = (counters[category] || 0) + 1;
    return `${category}-${String(counters[category]).padStart(3, '0')}`;
  };

  lines.push('tasks:');
  let any = false;

  (carried || []).forEach((r) => {
    any = true;
    const category = r.item.format.toUpperCase();
    const status = mapStatus(progressByKey?.[`${r.dueDate}::${r.client}::${r.item.num}`]?.status);
    pushTask(lines, {
      id: nextId(category), client: r.client, category, title: r.item.topic || '(untitled)',
      priority: 'P1', durationMin: r.timeMin, status, carriedOver: true, originallyDue: r.dueDate, item: r.item,
    });
  });

  postRows.forEach((r) => {
    any = true;
    const category = r.item.format.toUpperCase();
    const status = mapStatus(progressByKey?.[`${isoDate}::${r.client}::${r.item.num}`]?.status);
    pushTask(lines, {
      id: nextId(category), client: r.client, category, title: r.item.topic || '(untitled)',
      priority: 'P2', durationMin: r.timeMin, status, item: r.item,
    });
  });

  if (!any) lines.push('  []');
  lines.push('');

  const pendingExtra = (extraTasks || []).filter((t) => t.status !== 'completed');
  lines.push('backlog:');
  if (!pendingExtra.length) {
    lines.push('  []');
  } else {
    pendingExtra.forEach((t) => lines.push(`  - ${yStr(t.title)}`));
  }
  lines.push('');

  lines.push('assistant_request:');
  lines.push('  - Prioritize these tasks for maximum efficiency');
  lines.push('  - Batch similar work together');
  lines.push('  - Estimate total time to complete everything');
  lines.push('  - Draft captions/hooks for any items missing one');
  lines.push('  - Flag any blockers or dependencies');

  return lines.join('\n');
}
