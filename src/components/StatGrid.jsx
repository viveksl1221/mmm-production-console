import { WEEK_RANGES } from '../data/campaign.js';
import { fmtHours, getTodayInfo, totalTargets, totalShipped, weekDone, weekTarget, weekMinutes } from '../lib/derived.js';

export default function StatGrid({ posts, blogs }) {
  const target = totalTargets();
  const shipped = totalShipped(posts, blogs);
  const { weekNum } = getTodayInfo();
  const wk = weekNum || 1;

  return (
    <div className="stat-grid">
      <div className="stat-card">
        <div className="n mono">{target - shipped}</div>
        <div className="l">items remaining</div>
      </div>
      <div className="stat-card">
        <div className="n mono">{shipped}</div>
        <div className="l">shipped so far</div>
      </div>
      <div className="stat-card">
        <div className="n mono">{WEEK_RANGES[wk].label}</div>
        <div className="l">{weekDone(wk, posts)}/{weekTarget(wk)} this week</div>
      </div>
      <div className="stat-card">
        <div className="n mono">~{fmtHours(weekMinutes(wk))}</div>
        <div className="l">est. hours this week</div>
      </div>
    </div>
  );
}
