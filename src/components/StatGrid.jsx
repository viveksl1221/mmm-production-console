import { WEEK_RANGES } from '../data/campaign.js';
import { fmtHours, getTodayInfo, remainingBreakdown, totalTargets, totalShipped, weekDone, weekTarget, weekMinutes } from '../lib/derived.js';

export default function StatGrid({ posts, blogs, itemsByClient, weeklyData, blogTargets, blogPerWeek }) {
  const target = totalTargets(blogTargets, itemsByClient);
  const shipped = totalShipped(itemsByClient, posts, blogs);
  const { weekNum } = getTodayInfo();
  const wk = weekNum || 1;
  const remaining = remainingBreakdown(itemsByClient, posts, blogs, blogTargets);

  return (
    <div className="stat-grid">
      <div className="stat-card stat-card-remaining">
        <div className="n mono">{target - shipped}</div>
        <div className="l">items remaining</div>
        <div className="stat-breakdown">
          {Object.entries(remaining).filter(([, n]) => n > 0).map(([label, n]) => (
            <span className={`format-pill ${label === 'Not Yet Planned' ? 'format-warn' : ''}`} key={label}>
              {n} {label}{label === 'Blog Creative' && n > 1 ? 's' : ''}
            </span>
          ))}
        </div>
      </div>
      <div className="stat-card">
        <div className="n mono">{shipped}</div>
        <div className="l">shipped so far</div>
      </div>
      <div className="stat-card">
        <div className="n mono">{WEEK_RANGES[wk].label}</div>
        <div className="l">{weekDone(wk, itemsByClient, posts)}/{weekTarget(wk, weeklyData, blogPerWeek)} this week</div>
      </div>
      <div className="stat-card">
        <div className="n mono">~{fmtHours(weekMinutes(wk, weeklyData, blogPerWeek))}</div>
        <div className="l">est. hours this week</div>
      </div>
    </div>
  );
}
