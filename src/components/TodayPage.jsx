import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { CAMPAIGN_MONTH_INDEX, CAMPAIGN_YEAR, WEEK_RANGES } from '../data/campaign.js';
import { useDailyProgress } from '../hooks/useDailyProgress.js';
import { useExtraTasks } from '../hooks/useExtraTasks.js';
import { CLIENT_LOGOS } from '../lib/clientLogos.js';
import { DAILY_STATUS_COLOR, DAILY_STATUS_LABEL } from '../lib/constants.js';
import {
  campaignMonthBounds, carriedOverRows, clientDayAssignments, dayTaskLabel, fmtClock, fmtHours, getTodayInfo,
  isoDateForWeekday, postKey, slug, todaysCounts, todaysItems,
} from '../lib/derived.js';
import { buildDaySummaryText } from '../lib/summaryText.js';
import PostDetailModal from './PostDetailModal.jsx';
import SummaryPreviewModal from './SummaryPreviewModal.jsx';

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function liveElapsedSeconds(entry) {
  if (!entry) return 0;
  if (entry.startedAt) return entry.elapsedSeconds + Math.floor((Date.now() - entry.startedAt) / 1000);
  return entry.elapsedSeconds;
}

function inCampaignMonth(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === CAMPAIGN_YEAR && d.getMonth() === CAMPAIGN_MONTH_INDEX;
}

function fmtShortDate(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return new Date(2000, m - 1, d).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function ChecklistRow({ client, title, subtitle, format, timeMin, dueTag, entry, onStart, onPause, onComplete, onReset, onOpenDetail, onRemove }) {
  const status = entry?.status || 'not_started';
  const running = status === 'in_progress' && !!entry?.startedAt;
  const elapsed = liveElapsedSeconds(entry);
  const hasBudget = timeMin > 0;
  const overBudget = hasBudget && elapsed > timeMin * 60 && status !== 'completed';
  const col = DAILY_STATUS_COLOR[status];
  const startedClock = running && entry?.startedAt ? new Date(entry.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null;

  return (
    <div className="today-row">
      {client && CLIENT_LOGOS[client] && <img className="today-row-logo" src={CLIENT_LOGOS[client]} alt="" />}
      <div className={`today-row-body${onOpenDetail ? ' today-row-body-clickable' : ''}`} onClick={onOpenDetail}>
        <div className="today-row-topic">
          {dueTag && <span className="due-tag">Due {dueTag}</span>}
          {title}
        </div>
        {subtitle && <div className="today-row-hook">{subtitle}</div>}
      </div>
      {format && <span className="format-pill">{format}</span>}

      <div className="today-row-timer">
        <div className={`today-row-clock mono${overBudget ? ' over-budget' : ''}`}>
          {status === 'not_started' ? '—' : fmtClock(elapsed)}
        </div>
        {(hasBudget || startedClock) && (
          <div className="today-row-budget mono">
            {hasBudget ? `of ~${fmtHours(timeMin)} budget` : ''}
            {startedClock ? `${hasBudget ? ' · ' : ''}started ${startedClock}` : ''}
          </div>
        )}
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
        {onRemove && <button className="row-remove" title="Delete task" onClick={onRemove}>×</button>}
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

// Week + day navigator — lets you browse and act on any day in the
// campaign month, not just today. Each day tab shows its own task type and
// done/total so you can see at a glance what's still open days out.
function CalendarStrip({ selWeek, selDay, onSelectWeek, onSelectDay, today, itemsByClient, progressByKey, dayAssignments }) {
  return (
    <div className="cal-strip">
      <div className="cal-week-tabs">
        {[1, 2, 3, 4].map((w) => (
          <button
            key={w}
            className={`cal-week-tab${selWeek === w ? ' active' : ''}${today.weekNum === w ? ' is-current' : ''}`}
            onClick={() => onSelectWeek(w)}
          >
            {WEEK_RANGES[w].label}
          </button>
        ))}
      </div>
      <div className="cal-day-tabs">
        {[1, 2, 3, 4, 5].map((wd) => {
          const iso = isoDateForWeekday(selWeek, wd);
          const counts = todaysCounts(itemsByClient, selWeek, wd, iso, progressByKey, dayAssignments);
          const isToday = today.isoDate === iso;
          return (
            <button
              key={wd}
              className={`cal-day-tab${selDay === wd ? ' active' : ''}${isToday ? ' is-today' : ''}`}
              onClick={() => onSelectDay(wd)}
            >
              <div className="cal-day-name">{WEEKDAY_SHORT[wd]}{isToday && <span className="cal-today-dot" />}</div>
              <div className="cal-day-date mono">{fmtShortDate(iso)}</div>
              <div className="cal-day-task">{dayTaskLabel(wd, dayAssignments).name}</div>
              {counts.total > 0 && (
                <div className={`cal-day-progress mono${counts.done === counts.total ? ' complete' : ''}`}>
                  {counts.done}/{counts.total}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function TodayPage() {
  const { userId, content, posts } = useOutletContext();
  const today = getTodayInfo();
  const [selWeek, setSelWeek] = useState(today.weekNum || 1);
  const [selDay, setSelDay] = useState(today.weekday >= 1 && today.weekday <= 5 ? today.weekday : 1);
  const selIsoDate = isoDateForWeekday(selWeek, selDay);
  const isViewingToday = today.isoDate === selIsoDate;
  const selWeekAssignments = clientDayAssignments(selWeek, content.itemsByClient);

  const { start: monthStart, end: monthEnd } = campaignMonthBounds();
  const { progressByKey, loading, startTimer, pauseTimer, completeItem, resetItem } = useDailyProgress(monthStart, monthEnd, userId);
  const extra = useExtraTasks(userId);
  const [detailFor, setDetailFor] = useState(null);
  const [extraTitle, setExtraTitle] = useState('');
  const [summaryText, setSummaryText] = useState(null);

  // Forces a re-render every second so running timers visibly tick — only
  // costs anything while this page is mounted and someone has a clock going.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Computed once at the top so both the checklist body and the summary
  // preview read the same carried-over list. Uses today's own week
  // assignments (not selWeek's) since carry-over is always about real today,
  // regardless of which day/week is currently being browsed.
  const todayAssignments = today.weekNum ? clientDayAssignments(today.weekNum, content.itemsByClient) : null;
  const carried = !loading && today.weekNum
    ? carriedOverRows(content.itemsByClient, today.weekNum, today.weekday, today.isoDate, progressByKey, todayAssignments)
    : [];

  let calendarBody;
  if (loading) {
    calendarBody = <div className="loading-state">Loading…</div>;
  } else {
    const task = dayTaskLabel(selDay, selWeekAssignments);
    const postRows = todaysItems(content.itemsByClient, selWeek, selDay, selWeekAssignments);
    const carriedForToday = isViewingToday ? carried : [];

    const { total: totalCount, done: completedCount, inProgress: inProgressCount, pending: pendingCount } =
      todaysCounts(content.itemsByClient, selWeek, selDay, selIsoDate, progressByKey, selWeekAssignments);
    const totalMinutes = postRows.reduce((a, r) => a + r.timeMin, 0);
    const loggedSeconds = postRows.reduce((a, r) => a + liveElapsedSeconds(progressByKey[`${selIsoDate}::${r.client}::${r.item.num}`]), 0);
    const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

    const grouped = {};
    postRows.forEach((r) => (grouped[r.client] ||= []).push(r));
    const carriedGrouped = {};
    carriedForToday.forEach((r) => (carriedGrouped[r.client] ||= []).push(r));

    function openSummaryPreview() {
      setSummaryText(buildDaySummaryText({
        isoDate: selIsoDate,
        dayLabel: `${WEEKDAY_FULL[selDay]}, ${fmtShortDate(selIsoDate)}`,
        weekLabel: WEEK_RANGES[selWeek].label,
        isToday: isViewingToday,
        task,
        postRows,
        carried: carriedForToday,
        extraTasks: extra.tasks,
        progressByKey,
      }));
    }

    calendarBody = (
      <>
        <div className="today-summary">
          <div className="today-summary-top">
            <div className="today-summary-task">
              <div className="today-summary-name">
                {task.name}
                <span className="today-summary-date mono">{fmtShortDate(selIsoDate)}{isViewingToday ? ' · Today' : ''}</span>
              </div>
              <div className="today-summary-detail">{task.detail}</div>
              <button className="today-summary-copy-btn" onClick={openSummaryPreview}>Copy Summary for AI →</button>
            </div>
            <div className="today-summary-progress">
              <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
              <div className="bar-num mono">
                logged {fmtHours(Math.round(loggedSeconds / 60))} of ~{fmtHours(totalMinutes)} budget
              </div>
            </div>
          </div>
          {totalCount > 0 && (
            <div className="today-summary-stats">
              <div className="today-stat today-stat-done">
                <span className="today-stat-n mono">{completedCount}</span>
                <span className="today-stat-l">Done</span>
              </div>
              <div className="today-stat today-stat-progress">
                <span className="today-stat-n mono">{inProgressCount}</span>
                <span className="today-stat-l">In Progress</span>
              </div>
              <div className="today-stat today-stat-pending">
                <span className="today-stat-n mono">{pendingCount}</span>
                <span className="today-stat-l">Pending</span>
              </div>
              <div className="today-stat today-stat-total">
                <span className="today-stat-n mono">{totalCount}</span>
                <span className="today-stat-l">Total</span>
              </div>
            </div>
          )}
        </div>

        {carriedForToday.length > 0 && (
          <div className="today-carried-section">
            <div className="section-label today-carried-label">
              Carried Over <span className="today-carried-count mono">{carriedForToday.length}</span>
            </div>
            {Object.entries(carriedGrouped).map(([client, rows]) => (
              <ClientGroup client={client} linkTo={`/clients/${slug(client)}`} key={`carried-${client}`}>
                {rows.map(({ item, timeMin, dueWeekday, dueDate }) => {
                  const key = `${dueDate}::${client}::${item.num}`;
                  return (
                    <ChecklistRow
                      key={key}
                      client={client}
                      title={item.topic || '(untitled)'}
                      subtitle={item.hook}
                      format={item.format}
                      timeMin={timeMin}
                      dueTag={WEEKDAY_SHORT[dueWeekday]}
                      entry={progressByKey[key]}
                      onStart={() => startTimer(client, item.num, dueDate)}
                      onPause={() => pauseTimer(client, item.num, dueDate)}
                      onComplete={() => completeItem(client, item.num, dueDate)}
                      onReset={() => resetItem(client, item.num, dueDate)}
                      onOpenDetail={() => setDetailFor({ client, item })}
                    />
                  );
                })}
              </ClientGroup>
            ))}
          </div>
        )}

        {totalCount === 0 && <div className="empty-state">Nothing scheduled for this day's task type.</div>}

        {Object.entries(grouped).map(([client, rows]) => (
          <ClientGroup client={client} linkTo={`/clients/${slug(client)}`} key={client}>
            {rows.map(({ item, timeMin }) => {
              const key = `${selIsoDate}::${client}::${item.num}`;
              return (
                <ChecklistRow
                  key={key}
                  client={client}
                  title={item.topic || '(untitled)'}
                  subtitle={item.hook}
                  format={item.format}
                  timeMin={timeMin}
                  entry={progressByKey[key]}
                  onStart={() => startTimer(client, item.num, selIsoDate)}
                  onPause={() => pauseTimer(client, item.num, selIsoDate)}
                  onComplete={() => completeItem(client, item.num, selIsoDate)}
                  onReset={() => resetItem(client, item.num, selIsoDate)}
                  onOpenDetail={() => setDetailFor({ client, item })}
                />
              );
            })}
          </ClientGroup>
        ))}
      </>
    );
  }

  const monthTasks = extra.tasks.filter((t) => inCampaignMonth(t.createdAt));
  const monthDone = monthTasks.filter((t) => t.status === 'completed').length;

  async function handleAddExtra(e) {
    e.preventDefault();
    const title = extraTitle.trim();
    if (!title) return;
    setExtraTitle('');
    await extra.addTask(title);
  }

  return (
    <>
      <CalendarStrip
        selWeek={selWeek}
        selDay={selDay}
        onSelectWeek={setSelWeek}
        onSelectDay={setSelDay}
        today={today}
        itemsByClient={content.itemsByClient}
        progressByKey={progressByKey}
        dayAssignments={selWeekAssignments}
      />

      {calendarBody}

      <div className="today-extra-section">
        <div className="today-extra-head">
          <div className="section-label today-extra-label">Additional Tasks</div>
          <div className="today-extra-month mono">{monthDone}/{monthTasks.length} done this month</div>
        </div>
        <form className="today-extra-form" onSubmit={handleAddExtra}>
          <input
            className="edit-input today-extra-input"
            value={extraTitle}
            onChange={(e) => setExtraTitle(e.target.value)}
            placeholder="Add a task that's not on the calendar…"
            maxLength={140}
          />
          <button className="add-post-btn" type="submit" disabled={!extraTitle.trim()}>+ Add</button>
        </form>
        {extra.loading ? (
          <div className="loading-state">Loading…</div>
        ) : extra.tasks.length === 0 ? (
          <div className="empty-state">Nothing extra on the list.</div>
        ) : (
          <div className="today-group-rows">
            {extra.tasks.map((t) => (
              <ChecklistRow
                key={t.id}
                title={t.title}
                entry={t}
                onStart={() => extra.startTimer(t.id)}
                onPause={() => extra.pauseTimer(t.id)}
                onComplete={() => extra.completeItem(t.id)}
                onReset={() => extra.resetItem(t.id)}
                onRemove={() => extra.removeTask(t.id)}
              />
            ))}
          </div>
        )}
      </div>

      {detailFor && (
        <PostDetailModal
          client={detailFor.client}
          item={detailFor.item}
          status={posts[postKey(detailFor.client, detailFor.item.num)] || 'Planned'}
          onClose={() => setDetailFor(null)}
        />
      )}

      {summaryText && (
        <SummaryPreviewModal text={summaryText} onClose={() => setSummaryText(null)} />
      )}
    </>
  );
}
