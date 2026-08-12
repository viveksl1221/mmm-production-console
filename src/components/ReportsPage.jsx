import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { WEEK_RANGES } from '../data/campaign.js';
import { STATUS_COLOR, nextStatus } from '../lib/constants.js';
import {
  computeWeekly, fmtHours, getTodayInfo, postKey, totalShipped, totalTargets,
  weekClientBreakdown, weekDone, weekMinutes, weekTarget, wkBucket,
} from '../lib/derived.js';
import { buildReportText } from '../lib/reportText.js';
import BurnChart from './BurnChart.jsx';
import ClientBarChart from './ClientBarChart.jsx';
import SummaryPreviewModal from './SummaryPreviewModal.jsx';

function StatusPill({ status, onCycle }) {
  const col = STATUS_COLOR[status] || STATUS_COLOR.Planned;
  return (
    <button
      className="status-btn report-status-btn"
      style={{ background: col.bg, color: col.fg, borderColor: col.bd }}
      onClick={onCycle}
      title="Click to advance status"
    >
      <span className="status-dot" style={{ background: col.fg }} />
      {status}
    </button>
  );
}

// Client groups + per-post rows for one week, with a click-to-cycle status
// pill — same status set/order as ClientPage.jsx's EditableItemRow, just
// status-only here (editing topic/hook stays on the Clients page).
function WeekTaskSection({ w, itemsByClient, posts, setPostStatus, blogPerWeek }) {
  const rows = weekClientBreakdown(w, itemsByClient, posts, blogPerWeek);
  if (!rows.length) {
    return <div className="empty-state">No posts scheduled for this week yet.</div>;
  }
  return (
    <>
      {rows.map((row) => (
        <div className="report-client-group" key={row.client}>
          <div className="report-client-name">
            {row.client} <span className="report-client-count mono">{row.done}/{row.total} shipped</span>
          </div>
          <div className="report-table">
            {(itemsByClient[row.client] || [])
              .filter((it) => wkBucket(it.week) === w)
              .sort((a, b) => a.num - b.num)
              .map((it) => {
                const status = posts[postKey(row.client, it.num)] || 'Planned';
                return (
                  <div className="report-row" key={it.num}>
                    <span className="format-pill">{it.format}</span>
                    <div className="report-row-body">
                      <div className="report-row-topic">{it.topic || '(untitled)'}</div>
                      {it.hook && <div className="report-row-hook">{it.hook}</div>}
                    </div>
                    <StatusPill status={status} onCycle={() => setPostStatus(row.client, it.num, nextStatus(status))} />
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </>
  );
}

export default function ReportsPage() {
  const { posts, blogs, setPostStatus, content, blogTargets, blogPerWeek } = useOutletContext();
  const { weekNum: currentWeek } = getTodayInfo();
  const [scope, setScope] = useState('weekly');
  const [week, setWeek] = useState(currentWeek || 1);
  const [reportText, setReportText] = useState(null);

  const weeklyData = computeWeekly(content.itemsByClient);
  const isWeekly = scope === 'weekly';

  const target = isWeekly ? weekTarget(week, weeklyData, blogPerWeek) : totalTargets(blogTargets);
  const done = isWeekly ? weekDone(week, content.itemsByClient, posts) : totalShipped(posts, blogs);
  const hours = isWeekly
    ? weekMinutes(week, weeklyData, blogPerWeek)
    : [1, 2, 3, 4].reduce((a, w) => a + weekMinutes(w, weeklyData, blogPerWeek), 0);

  function openTextPreview() {
    setReportText(buildReportText({ scope, week, itemsByClient: content.itemsByClient, posts, blogs, weeklyData, blogTargets, blogPerWeek }));
  }

  return (
    <div className="report-page">
      <div className="report-toolbar">
        <div className="report-scope-toggle">
          <button className={`report-scope-btn${isWeekly ? ' active' : ''}`} onClick={() => setScope('weekly')}>Weekly</button>
          <button className={`report-scope-btn${!isWeekly ? ' active' : ''}`} onClick={() => setScope('monthly')}>Monthly</button>
        </div>
        {isWeekly && (
          <div className="report-week-picker">
            {[1, 2, 3, 4].map((w) => (
              <button key={w} className={`report-week-btn${week === w ? ' active' : ''}`} onClick={() => setWeek(w)}>
                {WEEK_RANGES[w].label}
              </button>
            ))}
          </div>
        )}
        <div className="report-toolbar-actions">
          <button className="add-post-btn" onClick={openTextPreview}>Copy as Text</button>
          <button className="add-post-btn primary" onClick={() => window.print()}>Download PDF</button>
        </div>
      </div>

      <div className="report-print-area">
        <div className="report-header">
          <div className="report-title">{isWeekly ? `${WEEK_RANGES[week].label} Report` : 'Monthly Report — August 2026'}</div>
          <div className="report-subtitle">
            {isWeekly ? `${WEEK_RANGES[week].start} – ${WEEK_RANGES[week].end}` : 'Aug 1 – Aug 31'}
            {' · '}Generated {new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </div>
        </div>

        <div className="report-stat-row">
          <div className="stat-card">
            <div className="n mono">{done}/{target}</div>
            <div className="l">shipped</div>
          </div>
          <div className="stat-card">
            <div className="n mono">~{fmtHours(hours)}</div>
            <div className="l">estimated production</div>
          </div>
        </div>

        {isWeekly ? (
          <ClientBarChart w={week} itemsByClient={content.itemsByClient} posts={posts} blogPerWeek={blogPerWeek} />
        ) : (
          <BurnChart posts={posts} itemsByClient={content.itemsByClient} weeklyData={weeklyData} blogPerWeek={blogPerWeek} />
        )}

        <div className="section-label report-section-label">Tasks</div>
        {isWeekly ? (
          <WeekTaskSection w={week} itemsByClient={content.itemsByClient} posts={posts} setPostStatus={setPostStatus} blogPerWeek={blogPerWeek} />
        ) : (
          [1, 2, 3, 4].map((w) => (
            <div className="report-month-week" key={w}>
              <div className="report-week-heading">
                {WEEK_RANGES[w].label} <span className="mono">{WEEK_RANGES[w].start} – {WEEK_RANGES[w].end}</span>
              </div>
              <WeekTaskSection w={w} itemsByClient={content.itemsByClient} posts={posts} setPostStatus={setPostStatus} blogPerWeek={blogPerWeek} />
            </div>
          ))
        )}
      </div>

      {reportText && <SummaryPreviewModal text={reportText} onClose={() => setReportText(null)} />}
    </div>
  );
}
