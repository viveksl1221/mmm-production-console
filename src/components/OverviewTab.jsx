import { useOutletContext } from 'react-router-dom';
import { ALL_CLIENTS, BLOG_TARGETS, POST_TARGETS } from '../data/campaign.js';
import { computeWeekly } from '../lib/derived.js';
import ClientOverviewCard from './ClientOverviewCard.jsx';
import StatGrid from './StatGrid.jsx';
import TodayCard from './TodayCard.jsx';

export default function OverviewTab() {
  const { posts, blogs, content, userId, blogTargets, blogPerWeek } = useOutletContext();
  const weeklyData = computeWeekly(content.itemsByClient);
  return (
    <>
      <TodayCard itemsByClient={content.itemsByClient} userId={userId} blogPerWeek={blogPerWeek} />
      <StatGrid posts={posts} blogs={blogs} itemsByClient={content.itemsByClient} weeklyData={weeklyData} blogTargets={blogTargets} blogPerWeek={blogPerWeek} />
      <div className="section-label">Clients</div>
      {ALL_CLIENTS.map((client) => (
        <ClientOverviewCard
          key={client}
          client={client}
          items={content.getItems(client)}
          posts={posts}
          hasP={POST_TARGETS[client] !== undefined}
          hasB={BLOG_TARGETS[client] !== undefined}
          postTarget={POST_TARGETS[client] || 0}
          blogTarget={blogTargets[client] || 0}
          blogCount={blogs[client] || 0}
        />
      ))}
    </>
  );
}
