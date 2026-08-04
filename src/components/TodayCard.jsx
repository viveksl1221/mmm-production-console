import { useNavigate } from 'react-router-dom';
import { WEEK_RANGES } from '../data/campaign.js';
import { useDailyProgress } from '../hooks/useDailyProgress.js';
import { BATCH_TASK } from '../lib/constants.js';
import { getTodayInfo, todaysCounts } from '../lib/derived.js';

// Ring showing today's done vs. remaining split — strictly two-tone
// (black = done, red = still to do) rather than a third neutral shade,
// so the chart itself stays on the red/black palette.
function TodayDonut({ done, remaining, total }) {
  const size = 92;
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.round((done / total) * 100);

  const segments = [
    { count: done, color: '#171717' },
    { count: remaining, color: '#FF4A4A' },
  ].filter((s) => s.count > 0);

  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="today-donut">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E7E7E7" strokeWidth={stroke} />
      {segments.map((seg, i) => {
        const len = (seg.count / total) * c;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        offset += len;
        return el;
      })}
      <text x="50%" y="50%" textAnchor="middle" dy="0.32em" className="today-donut-pct">
        {pct}%
      </text>
    </svg>
  );
}

export default function TodayCard({ itemsByClient, userId }) {
  const navigate = useNavigate();
  const { weekday, weekNum, isoDate } = getTodayInfo();
  const { progressByKey, loading } = useDailyProgress(isoDate, isoDate, userId);

  if (!weekNum) {
    return (
      <div className="today-card">
        <div className="today-eyebrow">Outside campaign window</div>
        <div className="today-title">This console tracks August 2026</div>
      </div>
    );
  }

  if (weekday === 0 || weekday === 6) {
    return (
      <div className="today-card">
        <div className="today-eyebrow">{WEEK_RANGES[weekNum].label} · Off day</div>
        <div className="today-title">No batch task today</div>
        <div className="today-detail">Next up: Monday — hooks &amp; captions for {WEEK_RANGES[weekNum].label}</div>
      </div>
    );
  }

  const task = BATCH_TASK[weekday];
  const counts = !loading ? todaysCounts(itemsByClient, weekNum, weekday, isoDate, progressByKey) : null;
  const hasCounts = counts && counts.total > 0;

  return (
    <div className="today-card today-card-clickable" onClick={() => navigate('/today')}>
      <div className="today-card-top">
        <div className="today-card-intro">
          <div className="today-eyebrow">{WEEK_RANGES[weekNum].label} · Today's batch</div>
          <div className="today-title">{task.name}</div>
          <div className="today-detail">{task.detail}</div>
        </div>
        {hasCounts && (
          <TodayDonut done={counts.done} remaining={counts.inProgress + counts.pending} total={counts.total} />
        )}
      </div>

      {hasCounts && (
        <div className="today-card-stats">
          <div className="today-stat today-stat-done">
            <span className="today-stat-n mono">{counts.done}</span>
            <span className="today-stat-l">Done</span>
          </div>
          <div className="today-stat today-stat-progress">
            <span className="today-stat-n mono">{counts.inProgress}</span>
            <span className="today-stat-l">In Progress</span>
          </div>
          <div className="today-stat today-stat-pending">
            <span className="today-stat-n mono">{counts.pending}</span>
            <span className="today-stat-l">Pending</span>
          </div>
          <div className="today-stat today-stat-total">
            <span className="today-stat-n mono">{counts.total}</span>
            <span className="today-stat-l">Total</span>
          </div>
        </div>
      )}

      <div className="today-cta">View today's checklist →</div>
    </div>
  );
}
