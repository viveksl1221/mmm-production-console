import { useEffect, useState } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import { FIKA_GAP, WEEK_RANGES } from '../data/campaign.js';
import { CLIENT_LOGOS } from '../lib/clientLogos.js';
import { BATCH_TASK, TIME_MIN } from '../lib/constants.js';
import {
  blogPerWeek, computeWeekly, dayFormatPriority, fmtHours, getTodayInfo, slug, weekBlogTotal,
  weekClientBreakdown, weekDone, weekMinutes, weekPostTotal, weekTarget,
} from '../lib/derived.js';

const FORMAT_ORDER = ['Carousel', 'Static', 'Reel'];

function ClientBreakdownRow({ row, hasGap }) {
  const pct = row.total ? Math.round((row.done / row.total) * 100) : 0;
  return (
    <Link to={`/clients/${slug(row.client)}`} className="week-client-row">
      {CLIENT_LOGOS[row.client] && <img className="week-client-logo" src={CLIENT_LOGOS[row.client]} alt="" />}
      <div className="week-client-name">{row.client}</div>
      <div className="week-client-formats">
        {FORMAT_ORDER.filter((f) => row.counts[f] > 0).map((f) => (
          <span className={`format-pill format-${f.toLowerCase()}`} key={f}>{row.counts[f]} {f}</span>
        ))}
        {row.blogCount > 0 && <span className="format-pill format-blog">{row.blogCount} Blog{row.blogCount > 1 ? 's' : ''}</span>}
        {hasGap && <span className="format-pill format-warn">+{FIKA_GAP[hasGap]} open</span>}
      </div>
      <div className="week-client-progress">
        <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
        <div className="bar-num mono">{row.done}/{row.total}</div>
      </div>
    </Link>
  );
}

function ClientBreakdown({ w, rows }) {
  if (!rows.length) return <div className="week-empty">No posts scheduled for this week yet.</div>;
  return (
    <div className="week-client-list">
      {rows.map((row) => (
        <ClientBreakdownRow key={row.client} row={row} hasGap={row.client === 'Fika Time' && FIKA_GAP[w] ? w : null} />
      ))}
    </div>
  );
}

function PriorityList({ items }) {
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

function ScheduleDay({ dayNum, tag, sub, task, hours, detail, priority, isToday }) {
  return (
    <div className={`sched-day ${isToday ? 'current-day' : ''}`}>
      <div className="sched-marker">
        <div className="sched-num mono">{isToday ? '●' : dayNum}</div>
        <div className="sched-line" />
      </div>
      <div className="sched-body">
        <div className="sched-head">
          <div>
            <div className="sched-tag">{tag}{sub && <span className="sched-tag-sub">{sub}</span>}</div>
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

function BatchSchedule({ w, itemsByClient, clientRows, isCurrentWeek }) {
  const { weekday } = getTodayInfo();
  const todayDayNum = isCurrentWeek ? weekday : null; // 1=Mon...5=Fri (0=Sun, 6=Sat -> no match)
  const weeklyData = computeWeekly(itemsByClient);
  const f = weeklyData[w];
  const scMin = (f.Static || 0) * TIME_MIN.Static + (f.Carousel || 0) * TIME_MIN.Carousel;
  const reelMin = (f.Reel || 0) * TIME_MIN.Reel;
  const blogMin = weekBlogTotal(w) * TIME_MIN.Blog;

  const postPriority = dayFormatPriority(w, itemsByClient, ['Static', 'Carousel', 'Reel']);
  const scPriority = dayFormatPriority(w, itemsByClient, ['Static', 'Carousel']);
  const reelPriority = dayFormatPriority(w, itemsByClient, ['Reel']);
  const blogPriority = Object.entries(blogPerWeek[w])
    .filter(([, count]) => count > 0)
    .map(([client, count]) => ({ client, count }))
    .sort((a, b) => b.count - a.count);
  const reviewPriority = clientRows
    .map((r) => ({ client: r.client, count: r.total + r.blogCount }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="sched">
      <ScheduleDay
        dayNum="01" tag="Mon"
        task={BATCH_TASK[1].name}
        detail={`${weekPostTotal(w, weeklyData) - (FIKA_GAP[w] || 0)} posts need copy — start with the biggest batch`}
        priority={postPriority}
        isToday={todayDayNum === 1}
      />
      <ScheduleDay
        dayNum="02" tag="Tue" sub="statics + carousels"
        task={BATCH_TASK[2].name}
        hours={scMin}
        detail={`${f.Static || 0} statics, ${f.Carousel || 0} carousels`}
        priority={scPriority}
        isToday={todayDayNum === 2}
      />
      <ScheduleDay
        dayNum="03" tag="Wed" sub="reels"
        task={BATCH_TASK[3].name}
        hours={reelMin}
        detail={`${f.Reel || 0} Reels — batch edits and exports`}
        priority={reelPriority}
        isToday={todayDayNum === 3}
      />
      <ScheduleDay
        dayNum="04" tag="Thu" sub="blog creatives"
        task={BATCH_TASK[4].name}
        hours={blogMin}
        detail={`${weekBlogTotal(w)} blog creatives across ${blogPriority.length} client${blogPriority.length === 1 ? '' : 's'}`}
        priority={blogPriority}
        isToday={todayDayNum === 4}
      />
      <ScheduleDay
        dayNum="05" tag="Fri"
        task={BATCH_TASK[5].name}
        detail={BATCH_TASK[5].detail}
        priority={reviewPriority}
        isToday={todayDayNum === 5}
      />
    </div>
  );
}

function WeekCard({ w, isCurrent, isOpen, onToggle, itemsByClient, posts, weeklyData }) {
  const target = weekTarget(w, weeklyData);
  const done = weekDone(w, itemsByClient, posts);
  const pct = target ? Math.round((done / target) * 100) : 0;
  const r = WEEK_RANGES[w];
  const clientRows = weekClientBreakdown(w, itemsByClient, posts);

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
        <ClientBreakdown w={w} rows={clientRows} />

        {FIKA_GAP[w] && <div className="note">Includes {FIKA_GAP[w]} Fika Time slots with no topic yet — plan these Monday, before the rest of the week's copy.</div>}
        {weekMinutes(w, weeklyData) / 60 > 32 && <div className="note">~{fmtHours(weekMinutes(w, weeklyData))} of production this week (~{(weekMinutes(w, weeklyData) / 60 / 5).toFixed(1)}h/day across a 5-day batch).</div>}

        <div className="section-label wk-section-label">Batch schedule</div>
        <BatchSchedule w={w} itemsByClient={itemsByClient} clientRows={clientRows} isCurrentWeek={isCurrent} />
      </div>
    </div>
  );
}

export default function WeeklyTab() {
  const { posts, content } = useOutletContext();
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
        />
      ))}
    </>
  );
}
