import { useNavigate } from 'react-router-dom';
import { WEEK_RANGES } from '../data/campaign.js';
import { useDailyProgress } from '../hooks/useDailyProgress.js';
import { BATCH_TASK } from '../lib/constants.js';
import { getTodayInfo, todaysCounts } from '../lib/derived.js';

export default function TodayCard({ itemsByClient, userId }) {
  const navigate = useNavigate();
  const { weekday, weekNum, isoDate } = getTodayInfo();
  const { progressByKey, loading } = useDailyProgress(isoDate, userId);

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
  const counts = !loading ? todaysCounts(itemsByClient, weekNum, weekday, progressByKey) : null;

  return (
    <div className="today-card today-card-clickable" onClick={() => navigate('/today')}>
      <div className="today-eyebrow">{WEEK_RANGES[weekNum].label} · Today's batch</div>
      <div className="today-title">{task.name}</div>
      <div className="today-detail">{task.detail}</div>

      {counts && counts.total > 0 && (
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
