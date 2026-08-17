import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CLIENT_LOGOS } from '../lib/clientLogos.js';
import { clientDetailBreakdown, postKey, slug } from '../lib/derived.js';
import { STATUS_COLOR } from '../lib/constants.js';

export default function ClientOverviewCard({ client, items, posts, hasP, hasB, postTarget, blogTarget, blogCount, weekLabel, weekData }) {
  const [open, setOpen] = useState(false);

  let doneCount = 0;
  items.forEach((it) => {
    if ((posts[postKey(client, it.num)] || 'Planned') === 'Approved') doneCount++;
  });

  const totalDone = doneCount + blogCount;
  const totalTarget = postTarget + blogTarget;
  const pct = totalTarget ? Math.round((totalDone / totalTarget) * 100) : 0;

  const metaBits = [];
  if (hasP) metaBits.push(`${items.length}/${postTarget} posts planned`);
  if (hasB) metaBits.push(`${blogTarget} blog creatives`);

  const detail = open ? clientDetailBreakdown(client, items, posts, blogCount, blogTarget) : null;

  return (
    <div className="client-block">
      <div className="client-head" onClick={() => setOpen(!open)}>
        <div className="client-title">
          {CLIENT_LOGOS[client] && <img className="client-logo" src={CLIENT_LOGOS[client]} alt="" />}
          <div>
            <div className="client-name">{client}</div>
            <div className="client-meta">{metaBits.join(' · ')}</div>
          </div>
        </div>
        <div className="wk-right">
          <div className="bar-wrap">
            <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
            <div className="bar-num mono">{totalDone} / {totalTarget} shipped</div>
          </div>
          <div className="client-open">Details <span className={`chev ${open ? 'chev-open' : ''}`}>▸</span></div>
        </div>
      </div>

      {open && detail && (
        <div className="client-detail">
          {weekData && (
            <div className="client-detail-week">
              <div className="client-detail-week-label">{weekLabel} — due</div>
              <div className="client-detail-week-pills">
                {Object.entries(weekData.counts).filter(([, n]) => n > 0).map(([fmt, n]) => (
                  <span className="format-pill" key={fmt}>{n} {fmt}{n > 1 ? 's' : ''}</span>
                ))}
                {weekData.blogCount > 0 && (
                  <span className="format-pill">{weekData.blogCount} Blog Creative{weekData.blogCount > 1 ? 's' : ''}</span>
                )}
              </div>
              <div className="client-detail-week-progress">{weekData.done}/{weekData.total} posts done this week</div>
            </div>
          )}

          <div className="client-detail-row">
            {Object.entries(detail.formats).map(([fmt, { total, done }]) => (
              <div className="client-detail-stat" key={fmt}>
                <div className="n mono">{done}/{total}</div>
                <div className="l">{fmt}{total > 1 ? 's' : ''} approved</div>
              </div>
            ))}
            {hasB && (
              <div className="client-detail-stat">
                <div className="n mono">{detail.blogCount}/{detail.blogTarget}</div>
                <div className="l">Blog creatives</div>
              </div>
            )}
          </div>

          <div className="client-detail-pipeline">
            {Object.entries(detail.statuses).map(([status, n]) => (
              <span
                key={status}
                className="status-count-pill"
                style={{ background: STATUS_COLOR[status].bg, color: STATUS_COLOR[status].fg, borderColor: STATUS_COLOR[status].bd }}
              >
                {n} {status}
              </span>
            ))}
          </div>

          <Link to={`/clients/${slug(client)}`} className="client-detail-open-link">Open full client page ▸</Link>
        </div>
      )}
    </div>
  );
}
