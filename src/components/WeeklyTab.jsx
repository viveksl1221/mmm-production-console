import { useEffect, useState } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import { FIKA_GAP, WEEK_RANGES } from '../data/campaign.js';
import { CLIENT_LOGOS } from '../lib/clientLogos.js';
import { TIME_MIN } from '../lib/constants.js';
import {
  blogPerWeek, computeWeekly, fmtHours, getTodayInfo, slug, weekBlogTotal, weekClientBreakdown,
  weekDone, weekMinutes, weekPostTotal, weekTarget,
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

function ClientBreakdown({ w, itemsByClient, posts }) {
  const rows = weekClientBreakdown(w, itemsByClient, posts);
  if (!rows.length) return <div className="week-empty">No posts scheduled for this week yet.</div>;
  return (
    <div className="week-client-list">
      {rows.map((row) => (
        <ClientBreakdownRow key={row.client} row={row} hasGap={row.client === 'Fika Time' && FIKA_GAP[w] ? w : null} />
      ))}
    </div>
  );
}

function DayPlan({ w, weeklyData }) {
  const f = weeklyData[w];
  const scMin = (f.Static || 0) * TIME_MIN.Static + (f.Carousel || 0) * TIME_MIN.Carousel;
  const reelMin = (f.Reel || 0) * TIME_MIN.Reel;
  const blogMin = weekBlogTotal(w) * TIME_MIN.Blog;
  return (
    <>
      <div className="day-row">
        <div className="day-tag">MON</div>
        <div className="day-content">
          <div className="day-task">Lock hooks &amp; captions — all clients, grouped by pillar</div>
          <div className="day-detail">{weekPostTotal(w, weeklyData)} posts + {weekBlogTotal(w)} blogs need copy</div>
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

function WeekCard({ w, isCurrent, isOpen, onToggle, itemsByClient, posts, weeklyData }) {
  const target = weekTarget(w, weeklyData);
  const done = weekDone(w, itemsByClient, posts);
  const pct = target ? Math.round((done / target) * 100) : 0;
  const r = WEEK_RANGES[w];
  const clientCount = weekClientBreakdown(w, itemsByClient, posts).length;

  return (
    <div className={`wk-card ${isCurrent ? 'current' : ''} ${isOpen ? 'open' : ''}`} data-week={w}>
      <div className="wk-head" onClick={onToggle}>
        <div className="wk-title-block">
          <div className="wk-name">{r.label}</div>
          <div className="wk-dates mono">{r.start} – {r.end}</div>
          {isCurrent && <div className="wk-badge">This week</div>}
        </div>
        <div className="wk-right">
          <div className="wk-client-count">{clientCount} client{clientCount === 1 ? '' : 's'}</div>
          <div className="bar-wrap">
            <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
            <div className="bar-num mono">{done} / {target} shipped</div>
          </div>
          <div className="chev">▸</div>
        </div>
      </div>
      <div className="wk-body">
        <div className="section-label wk-section-label">By client</div>
        <ClientBreakdown w={w} itemsByClient={itemsByClient} posts={posts} />

        {FIKA_GAP[w] && <div className="note">Includes {FIKA_GAP[w]} Fika Time slots with no topic yet — plan these Monday, before the rest of the week's copy.</div>}
        {weekMinutes(w, weeklyData) / 60 > 32 && <div className="note">~{fmtHours(weekMinutes(w, weeklyData))} of production this week (~{(weekMinutes(w, weeklyData) / 60 / 5).toFixed(1)}h/day across a 5-day batch).</div>}

        <div className="section-label wk-section-label">Batch schedule</div>
        <div className="wk-schedule">
          <DayPlan w={w} weeklyData={weeklyData} />
        </div>
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
