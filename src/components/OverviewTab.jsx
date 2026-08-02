import AttentionList from './AttentionList.jsx';
import BurnChart from './BurnChart.jsx';
import StatGrid from './StatGrid.jsx';
import TodayCard from './TodayCard.jsx';

export default function OverviewTab({ posts, blogs, onGotoWeek, onGotoClient }) {
  return (
    <>
      <TodayCard />
      <StatGrid posts={posts} blogs={blogs} />
      <BurnChart posts={posts} />
      <div className="section-label">Needs attention</div>
      <AttentionList onGotoWeek={onGotoWeek} onGotoClient={onGotoClient} />
    </>
  );
}
