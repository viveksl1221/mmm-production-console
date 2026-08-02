import { useEffect, useState } from 'react';
import { FIKA_GAP, WEEK_RANGES } from '../data/campaign.js';
import { TIME_MIN } from '../lib/constants.js';
import { blogPerWeek, fmtHours, getTodayInfo, weekBlogTotal, weekDone, weekMinutes, weekPostTotal, weekTarget, weekly } from '../lib/derived.js';

function clientChips(w) {
  const chips = [];
  Object.keys(weekly[w].clients).forEach((c) => chips.push(<div className="client-chip" key={c}><b>{weekly[w].clients[c]}</b> {c}</div>));
  if (FIKA_GAP[w]) chips.push(<div className="client-chip warn" key="fika-gap"><b>{FIKA_GAP[w]}</b> Fika Time (needs topics)</div>);
  Object.keys(blogPerWeek[w]).forEach((c) => {
    if (blogPerWeek[w][c] > 0) chips.push(<div className="client-chip" key={`blog-${c}`}><b>{blogPerWeek[w][c]}</b> {c} blog{blogPerWeek[w][c] > 1 ? 's' : ''}</div>);
  });
  return chips;
}

function DayPlan({ w }) {
  const f = weekly[w];
  const scMin = (f.Static || 0) * TIME_MIN.Static + (f.Carousel || 0) * TIME_MIN.Carousel;
  const reelMin = (f.Reel || 0) * TIME_MIN.Reel;
  const blogMin = weekBlogTotal(w) * TIME_MIN.Blog;
  return (
    <>
      <div className="day-row">
        <div className="day-tag">MON</div>
        <div className="day-content">
          <div className="day-task">Lock hooks &amp; captions — all clients, grouped by pillar</div>
          <div className="day-detail">{weekPostTotal(w)} posts + {weekBlogTotal(w)} blogs need copy</div>
        </div>
      </div>
      <div className="day-row">
        <div className="day-tag">TUE<span className="dt">statics + carousels</span></div>
        <div className="day-content"><div className="day-task">{f.Static || 0} statics, {f.Carousel || 0} carousels</div></div>
        <div className="day-hours">~{fmtHours(scMin)}</div>
      </div>
      <div className="day-row">
        <div className="day-tag">WED<span className="dt">reels</span></div>
        <div className="day-content"><div className="day-task">{f.Reel || 0} Reels — batch edits and exports</div></div>
        <div className="day-hours">~{fmtHours(reelMin)}</div>
      </div>
      <div className="day-row">
        <div className="day-tag">THU<span className="dt">blogs</span></div>
        <div className="day-content"><div className="day-task">{weekBlogTotal(w)} blog drafts across {Object.values(blogPerWeek[w]).filter((v) => v > 0).length} clients</div></div>
        <div className="day-hours">~{fmtHours(blogMin)}</div>
      </div>
      <div className="day-row">
        <div className="day-tag">FRI</div>
        <div className="day-content"><div className="day-task">Client review sends, revisions, scheduling, QA</div></div>
      </div>
    </>
  );
}

function WeekCard({ w, isCurrent, isOpen, onToggle, posts }) {
  const target = weekTarget(w);
  const done = weekDone(w, posts);
  const pct = target ? Math.round((done / target) * 100) : 0;
  const r = WEEK_RANGES[w];

  return (
    <div className={`wk-card ${isCurrent ? 'current' : ''} ${isOpen ? 'open' : ''}`} data-week={w}>
      <div className="wk-head" onClick={onToggle}>
        <div className="wk-title-block">
          <div className="wk-name">{r.label}</div>
          <div className="wk-dates mono">{r.start} – {r.end}</div>
          {isCurrent && <div className="wk-badge">This week</div>}
        </div>
        <div className="wk-right">
          <div className="bar-wrap">
            <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
            <div className="bar-num mono">{done} / {target} shipped</div>
          </div>
          <div className="chev">▸</div>
        </div>
      </div>
      <div className="wk-body">
        <div className="wk-clients">{clientChips(w)}</div>
        {FIKA_GAP[w] && <div className="note">Includes {FIKA_GAP[w]} Fika Time slots with no topic yet — plan these Monday, before the rest of the week's copy.</div>}
        {weekMinutes(w) / 60 > 32 && <div className="note">~{fmtHours(weekMinutes(w))} of production this week (~{(weekMinutes(w) / 60 / 5).toFixed(1)}h/day across a 5-day batch).</div>}
        <DayPlan w={w} />
      </div>
    </div>
  );
}

export default function WeeklyTab({ posts, openWeeks, setOpenWeeks, navRequest }) {
  const { weekNum: current } = getTodayInfo();
  const cur = current || 1;

  useEffect(() => {
    setOpenWeeks({ [cur]: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (navRequest?.type === 'week') {
      setOpenWeeks({ [navRequest.week]: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navRequest]);

  function toggleWeek(w) {
    setOpenWeeks((prev) => ({ ...prev, [w]: !prev[w] }));
  }

  return (
    <>
      {[1, 2, 3, 4].map((w) => (
        <WeekCard key={w} w={w} isCurrent={w === cur} isOpen={!!openWeeks[w]} onToggle={() => toggleWeek(w)} posts={posts} />
      ))}
    </>
  );
}
