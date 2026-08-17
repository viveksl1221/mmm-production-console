import { useEffect, useState } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import { FIKA_GAP, WEEK_RANGES } from '../data/campaign.js';
import { CLIENT_LOGOS } from '../lib/clientLogos.js';
import { REVIEW_TASK, STATUS_COLOR } from '../lib/constants.js';
import {
  clientDayAssignments, computeWeekly, dayTaskLabel, fmtHours, getTodayInfo, itemTimeMin, postKey, slug,
  weekClientBreakdown, weekDone, weekMinutes, weekTarget, wkBucket,
} from '../lib/derived.js';

const FORMAT_ORDER = ['Carousel', 'Static', 'Reel', 'Reel Cover'];

function WeekItemRow({ item, status }) {
  const c = STATUS_COLOR[status];
  return (
    <div className="week-item-row">
      <span className="item-num">#{item.num}</span>
      <span className="format-pill">{item.format}</span>
      <div className="week-item-topic">{item.topic || '(untitled)'}</div>
      <div className="week-item-hook">{item.hook}</div>
      <span className="status-count-pill" style={{ background: c.bg, color: c.fg, borderColor: c.bd }}>{status}</span>
    </div>
  );
}

function ClientBreakdownRow({ row, w, weekItems, posts, hasGap }) {
  const [open, setOpen] = useState(false);
  const pct = row.total ? Math.round((row.done / row.total) * 100) : 0;
  return (
    <div className="week-client-block">
      <div className="week-client-row" onClick={() => setOpen(!open)}>
        {CLIENT_LOGOS[row.client] && <img className="week-client-logo" src={CLIENT_LOGOS[row.client]} alt="" />}
        <div className="week-client-name">{row.client}</div>
        <div className="week-client-formats">
          {FORMAT_ORDER.filter((f) => row.counts[f] > 0).map((f) => (
            <span className="format-pill" key={f}>{row.counts[f]} {f}</span>
          ))}
          {row.blogCount > 0 && <span className="format-pill">{row.blogCount} Blog Creative{row.blogCount > 1 ? 's' : ''}</span>}
          {hasGap && <span className="format-pill format-warn">+{FIKA_GAP[hasGap]} open</span>}
        </div>
        <div className="week-client-progress">
          <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
          <div className="bar-num mono">{row.done}/{row.total}</div>
        </div>
        <span className={`chev ${open ? 'chev-open' : ''}`}>▸</span>
      </div>

      {open && (
        <div className="week-client-detail">
          {weekItems.map((item) => (
            <WeekItemRow key={item.num} item={item} status={posts[postKey(row.client, item.num)] || 'Planned'} />
          ))}
          <Link to={`/clients/${slug(row.client)}`} className="client-detail-open-link">Open full client page ▸</Link>
        </div>
      )}
    </div>
  );
}

function ClientBreakdown({ w, rows, itemsByClient, posts }) {
  if (!rows.length) return <div className="week-empty">No posts scheduled for this week yet.</div>;
  return (
    <div className="week-client-list">
      {rows.map((row) => (
        <ClientBreakdownRow
          key={row.client}
          row={row}
          w={w}
          weekItems={(itemsByClient[row.client] || []).filter((it) => wkBucket(it.week) === w)}
          posts={posts}
          hasGap={row.client === 'Fika Time' && FIKA_GAP[w] ? w : null}
        />
      ))}
    </div>
  );
}

function PriorityList({ items = [] }) {
  if (!items.length) return null;
  return (
    <ol className="priority-list">
      {items.map((p, i) => (
        <li className="priority-item" key={p.client}>
          <span className="priority-rank">{i + 1}</span>
          {CLIENT_LOGOS[p.client] && <img className="priority-logo" src={CLIENT_LOGOS[p.client]} alt="" />}
          <Link to={`/clients/${slug(p.client)}`} className="priority-name">{p.client}</Link>
          <span className="priority-count mono">{p.count}</span>
        </li>
      ))}
    </ol>
  );
}

function ScheduleDay({ dayNum, tag, task, hours, detail, priority, isToday }) {
  return (
    <div className={`sched-day ${isToday ? 'current-day' : ''}`}>
      <div className="sched-marker">
        <div className="sched-num mono">{isToday ? '●' : dayNum}</div>
        <div className="sched-line" />
      </div>
      <div className="sched-body">
        <div className="sched-head">
          <div>
            <div className="sched-tag">{tag}</div>
            <div className="sched-task">{task}</div>
          </div>
          {hours != null && (
            <div className="sched-hours"><span>Est.</span> ~{fmtHours(hours)}</div>
          )}
        </div>
        {detail && <div className="sched-detail">{detail}</div>}
        <PriorityList items={priority} />
      </div>
    </div>
  );
}

const DAY_TAGS = ['Mon', 'Tue', 'Wed', 'Thu'];

function BatchSchedule({ w, itemsByClient, clientRows, isCurrentWeek }) {
  const { weekday } = getTodayInfo();
  const todayDayNum = isCurrentWeek ? weekday : null; // 1=Mon...5=Fri (0=Sun, 6=Sat -> no match)
  const dayAssignments = clientDayAssignments(w, itemsByClient);

  function dayStats(clients) {
    const counts = { Static: 0, Carousel: 0, Reel: 0 };
    let minutes = 0;
    clients.forEach((client) => {
      (itemsByClient[client] || []).filter((it) => wkBucket(it.week) === w).forEach((it) => {
        counts[it.format] = (counts[it.format] || 0) + 1;
        minutes += itemTimeMin(it.format);
      });
    });
    // Every Reel implies its own separate cover creative — mirrored 1:1.
    if (counts.Reel) counts['Reel Cover'] = counts.Reel;
    return { counts, minutes };
  }

  const reviewPriority = clientRows
    .map((r) => ({ client: r.client, count: r.total }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="sched">
      {[1, 2, 3, 4].map((d) => {
        const clients = dayAssignments[d] || [];
        const { counts, minutes } = dayStats(clients);
        const label = dayTaskLabel(d, dayAssignments);
        const formatDetail = FORMAT_ORDER.filter((f) => counts[f] > 0)
          .map((f) => `${counts[f]} ${f.toLowerCase()}${counts[f] > 1 ? 's' : ''}`)
          .join(', ');
        return (
          <ScheduleDay
            key={d}
            dayNum={`0${d}`}
            tag={DAY_TAGS[d - 1]}
            task={label.name}
            hours={clients.length ? minutes : null}
            detail={clients.length ? formatDetail : label.detail}
            isToday={todayDayNum === d}
          />
        );
      })}
      <ScheduleDay
        dayNum="05" tag="Fri"
        task={REVIEW_TASK.name}
        detail={REVIEW_TASK.detail}
        priority={reviewPriority}
        isToday={todayDayNum === 5}
      />
    </div>
  );
}

function WeekCard({ w, isCurrent, isOpen, onToggle, itemsByClient, posts, weeklyData, blogPerWeek }) {
  const target = weekTarget(w, weeklyData, blogPerWeek);
  const done = weekDone(w, itemsByClient, posts);
  const pct = target ? Math.round((done / target) * 100) : 0;
  const r = WEEK_RANGES[w];
  const clientRows = weekClientBreakdown(w, itemsByClient, posts, blogPerWeek);

  return (
    <div className={`wk-card ${isCurrent ? 'current' : ''} ${isOpen ? 'open' : ''}`} data-week={w}>
      <div className="wk-head" onClick={onToggle}>
        <div className="wk-title-block">
          <div className="wk-name">{r.label}</div>
          <div className="wk-dates mono">{r.start} – {r.end}</div>
          {isCurrent && <div className="wk-badge">This week</div>}
        </div>
        <div className="wk-right">
          <div className="wk-client-count">{clientRows.length} client{clientRows.length === 1 ? '' : 's'}</div>
          <div className="bar-wrap">
            <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
            <div className="bar-num mono">{done} / {target} shipped</div>
          </div>
          <div className="chev">▸</div>
        </div>
      </div>
      <div className="wk-body">
        <div className="section-label wk-section-label">By client</div>
        <ClientBreakdown w={w} rows={clientRows} itemsByClient={itemsByClient} posts={posts} />

        {FIKA_GAP[w] && <div className="note">Includes {FIKA_GAP[w]} Fika Time slots with no topic yet — plan these before batching Fika Time's posts.</div>}
        {weekMinutes(w, weeklyData, blogPerWeek) / 60 > 32 && <div className="note">~{fmtHours(weekMinutes(w, weeklyData, blogPerWeek))} of production this week (~{(weekMinutes(w, weeklyData, blogPerWeek) / 60 / 5).toFixed(1)}h/day across a 5-day batch).</div>}

        <div className="section-label wk-section-label">Batch schedule</div>
        <BatchSchedule w={w} itemsByClient={itemsByClient} clientRows={clientRows} isCurrentWeek={isCurrent} />
      </div>
    </div>
  );
}

export default function WeeklyTab() {
  const { posts, content, blogPerWeek } = useOutletContext();
  const location = useLocation();
  const { weekNum: current } = getTodayInfo();
  const cur = current || 1;
  const [openWeeks, setOpenWeeks] = useState({ [cur]: true });
  const weeklyData = computeWeekly(content.itemsByClient);

  useEffect(() => {
    if (location.state?.openWeek) {
      setOpenWeeks({ [location.state.openWeek]: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  function toggleWeek(w) {
    setOpenWeeks((prev) => ({ ...prev, [w]: !prev[w] }));
  }

  return (
    <>
      {[1, 2, 3, 4].map((w) => (
        <WeekCard
          key={w}
          w={w}
          isCurrent={w === cur}
          isOpen={!!openWeeks[w]}
          onToggle={() => toggleWeek(w)}
          itemsByClient={content.itemsByClient}
          posts={posts}
          weeklyData={weeklyData}
          blogPerWeek={blogPerWeek}
        />
      ))}
    </>
  );
}
