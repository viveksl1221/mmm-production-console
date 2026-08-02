import { WEEK_RANGES } from '../data/campaign.js';
import { BATCH_TASK } from '../lib/constants.js';
import { getTodayInfo } from '../lib/derived.js';

export default function TodayCard() {
  const { weekday, weekNum } = getTodayInfo();

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
  return (
    <div className="today-card">
      <div className="today-eyebrow">{WEEK_RANGES[weekNum].label} · Today's batch</div>
      <div className="today-title">{task.name}</div>
      <div className="today-detail">{task.detail}</div>
    </div>
  );
}
