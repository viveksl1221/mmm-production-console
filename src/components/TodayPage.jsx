import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { WEEK_RANGES } from '../data/campaign.js';
import { useDailyProgress } from '../hooks/useDailyProgress.js';
import { CLIENT_LOGOS } from '../lib/clientLogos.js';
import { BATCH_TASK, DAILY_STATUS_COLOR, DAILY_STATUS_LABEL } from '../lib/constants.js';
import { fmtClock, fmtHours, getTodayInfo, slug, todaysBlogTasks, todaysItems } from '../lib/derived.js';

// Blog rows have no individual post record to key off of, so they get a
// synthetic client string ("Blog: My Health") with num=0 — keeps `num` a
// valid integer for the DB while staying unique per real client.
function blogProgressKey(client) {
  return `Blog: ${client}`;
}

function liveElapsedSeconds(entry) {
  if (!entry) return 0;
  if (entry.startedAt) return entry.elapsedSeconds + Math.floor((Date.now() - entry.startedAt) / 1000);
  return entry.elapsedSeconds;
}

function ChecklistRow({ client, title, subtitle, format, timeMin, entry, onStart, onPause, onComplete, onReset }) {
  const status = entry?.status || 'not_started';
  const running = status === 'in_progress' && !!entry?.startedAt;
  const elapsed = liveElapsedSeconds(entry);
  const budgetSec = timeMin * 60;
  const overBudget = elapsed > budgetSec && status !== 'completed';
  const col = DAILY_STATUS_COLOR[status];
  const startedClock = running && entry?.startedAt ? new Date(entry.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null;

  return (
    <div className="today-row">
      {CLIENT_LOGOS[client] && <img className="today-row-logo" src={CLIENT_LOGOS[client]} alt="" />}
      <div className="today-row-body">
        <div className="today-row-topic">{title}</div>
        {subtitle && <div className="today-row-hook">{subtitle}</div>}
      </div>
      {format && <span className="format-pill">{format}</span>}

      <div className="today-row-timer">
        <div className={`today-row-clock mono${overBudget ? ' over-budget' : ''}`}>
          {status === 'not_started' ? '—' : fmtClock(elapsed)}
        </div>
        <div className="today-row-budget mono">
          of ~{fmtHours(timeMin)} budget{startedClock ? ` · started ${startedClock}` : ''}
        </div>
      </div>

      <div className="today-row-actions">
        {status === 'not_started' && (
          <button className="timer-btn timer-btn-start" onClick={onStart}>▶ Start</button>
        )}
        {status === 'in_progress' && (
          <>
            {running ? (
              <button className="timer-btn" onClick={onPause}>⏸ Pause</button>
            ) : (
              <button className="timer-btn timer-btn-start" onClick={onStart}>▶ Resume</button>
            )}
            <button className="timer-btn timer-btn-done" onClick={onComplete}>✓ Done</button>
          </>
        )}
        {status === 'completed' && (
          <>
            <span className="status-pill" style={{ background: col.bg, color: col.fg, borderColor: col.bd }}>
              <span className="status-dot" style={{ background: col.fg }} />
              {DAILY_STATUS_LABEL[status]}
            </span>
            <button className="timer-btn timer-btn-reset" onClick={onReset}>Reopen</button>
          </>
        )}
      </div>
    </div>
  );
}

function ClientGroup({ client, linkTo, children }) {
  return (
    <div className="today-group">
      {linkTo ? (
        <Link to={linkTo} className="today-group-name">{client}</Link>
      ) : (
        <div className="today-group-name today-group-name-static">{client}</div>
      )}
      <div className="today-group-rows">{children}</div>
    </div>
  );
}

export default function TodayPage() {
  const { userId, content } = useOutletContext();
  const { weekday, weekNum, isoDate } = getTodayInfo();
  const { progressByKey, loading, startTimer, pauseTimer, completeItem, resetItem } = useDailyProgress(isoDate, userId);

  // Forces a re-render every second so running timers visibly tick — only
  // costs anything while this page is mounted and someone has a clock going.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!weekNum) {
    return <div className="empty-state">This console tracks August 2026 — nothing scheduled outside that window.</div>;
  }
  if (weekday === 0 || weekday === 6) {
    return (
      <div className="empty-state">
        No batch task today — it's the weekend. Next up: Monday — hooks &amp; captions for {WEEK_RANGES[weekNum].label}.
      </div>
    );
  }
  if (loading) {
    return <div className="loading-state">Loading…</div>;
  }

  const task = BATCH_TASK[weekday];
  const isBlogDay = weekday === 4;
  const postRows = isBlogDay ? [] : todaysItems(content.itemsByClient, weekNum, weekday);
  const blogRows = isBlogDay ? todaysBlogTasks(weekNum) : [];

  const totalCount = postRows.length + blogRows.length;
  const completedCount =
    postRows.filter((r) => (progressByKey[`${r.client}::${r.item.num}`]?.status || 'not_started') === 'completed').length +
    blogRows.filter((r) => (progressByKey[`${blogProgressKey(r.client)}::0`]?.status || 'not_started') === 'completed').length;
  const totalMinutes = postRows.reduce((a, r) => a + r.timeMin, 0) + blogRows.reduce((a, r) => a + r.timeMin, 0);
  const loggedSeconds =
    postRows.reduce((a, r) => a + liveElapsedSeconds(progressByKey[`${r.client}::${r.item.num}`]), 0) +
    blogRows.reduce((a, r) => a + liveElapsedSeconds(progressByKey[`${blogProgressKey(r.client)}::0`]), 0);
  const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const grouped = {};
  postRows.forEach((r) => (grouped[r.client] ||= []).push(r));

  return (
    <>
      <div className="today-summary">
        <div className="today-summary-task">
          <div className="today-summary-name">{task.name}</div>
          <div className="today-summary-detail">{task.detail}</div>
        </div>
        <div className="today-summary-progress">
          <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
          <div className="bar-num mono">
            {completedCount}/{totalCount} done · logged {fmtHours(Math.round(loggedSeconds / 60))} of ~{fmtHours(totalMinutes)} budget
          </div>
        </div>
      </div>

      {totalCount === 0 && <div className="empty-state">Nothing scheduled for today's task type this week.</div>}

      {Object.entries(grouped).map(([client, rows]) => (
        <ClientGroup client={client} linkTo={`/clients/${slug(client)}`} key={client}>
          {rows.map(({ item, timeMin }) => {
            const key = `${client}::${item.num}`;
            return (
              <ChecklistRow
                key={key}
                client={client}
                title={item.topic || '(untitled)'}
                subtitle={item.hook}
                format={item.format}
                timeMin={timeMin}
                entry={progressByKey[key]}
                onStart={() => startTimer(client, item.num)}
                onPause={() => pauseTimer(client, item.num)}
                onComplete={() => completeItem(client, item.num)}
                onReset={() => resetItem(client, item.num)}
              />
            );
          })}
        </ClientGroup>
      ))}

      {blogRows.length > 0 && (
        <ClientGroup client="Blog Creatives" key="__blogs">
          {blogRows.map(({ client, count, timeMin }) => {
            const bKey = blogProgressKey(client);
            return (
              <ChecklistRow
                key={client}
                client={client}
                title={client}
                subtitle={`${count} blog creative${count > 1 ? 's' : ''} due this week`}
                timeMin={timeMin}
                entry={progressByKey[`${bKey}::0`]}
                onStart={() => startTimer(bKey, 0)}
                onPause={() => pauseTimer(bKey, 0)}
                onComplete={() => completeItem(bKey, 0)}
                onReset={() => resetItem(bKey, 0)}
              />
            );
          })}
        </ClientGroup>
      )}
    </>
  );
}
