import { useOutletContext } from 'react-router-dom';
import AttentionList from './AttentionList.jsx';
import BurnChart from './BurnChart.jsx';
import StatGrid from './StatGrid.jsx';
import TodayCard from './TodayCard.jsx';

export default function OverviewTab() {
  const { posts, blogs } = useOutletContext();
  return (
    <>
      <TodayCard />
      <StatGrid posts={posts} blogs={blogs} />
      <BurnChart posts={posts} />
      <div className="section-label">Needs attention</div>
      <AttentionList />
    </>
  );
}
