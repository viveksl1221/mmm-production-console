import { useOutletContext } from 'react-router-dom';
import { computeWeekly } from '../lib/derived.js';
import AttentionList from './AttentionList.jsx';
import BurnChart from './BurnChart.jsx';
import StatGrid from './StatGrid.jsx';
import TodayCard from './TodayCard.jsx';

export default function OverviewTab() {
  const { posts, blogs, content, userId, blogTargets, blogPerWeek } = useOutletContext();
  const weeklyData = computeWeekly(content.itemsByClient);
  return (
    <>
      <TodayCard itemsByClient={content.itemsByClient} userId={userId} blogPerWeek={blogPerWeek} />
      <StatGrid posts={posts} blogs={blogs} itemsByClient={content.itemsByClient} weeklyData={weeklyData} blogTargets={blogTargets} blogPerWeek={blogPerWeek} />
      <BurnChart posts={posts} itemsByClient={content.itemsByClient} weeklyData={weeklyData} blogPerWeek={blogPerWeek} />
      <div className="section-label">Needs attention</div>
      <AttentionList weeklyData={weeklyData} blogPerWeek={blogPerWeek} />
    </>
  );
}
