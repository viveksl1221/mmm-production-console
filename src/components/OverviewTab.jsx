import { useOutletContext } from 'react-router-dom';
import { ALL_CLIENTS, POST_TARGETS, WEEK_RANGES } from '../data/campaign.js';
import { computeWeekly, getTodayInfo, weekClientBreakdown } from '../lib/derived.js';
import ClientOverviewCard from './ClientOverviewCard.jsx';
import StatGrid from './StatGrid.jsx';
import TodayCard from './TodayCard.jsx';

export default function OverviewTab() {
  const { posts, blogs, content, userId, blogTargets, blogPerWeek } = useOutletContext();
  const weeklyData = computeWeekly(content.itemsByClient);
  const { weekNum } = getTodayInfo();
  const wk = weekNum || 1;
  const weekRows = weekClientBreakdown(wk, content.itemsByClient, posts, blogPerWeek);
  const weekByClient = Object.fromEntries(weekRows.map((r) => [r.client, r]));

  return (
    <>
      <TodayCard itemsByClient={content.itemsByClient} userId={userId} />
      <StatGrid posts={posts} blogs={blogs} itemsByClient={content.itemsByClient} weeklyData={weeklyData} blogTargets={blogTargets} blogPerWeek={blogPerWeek} />
      <div className="section-label">Clients</div>
      {ALL_CLIENTS.map((client) => (
        <ClientOverviewCard
          key={client}
          client={client}
          items={content.getItems(client)}
          posts={posts}
          hasP={POST_TARGETS[client] !== undefined}
          hasB={(blogTargets[client] || 0) > 0}
          postTarget={POST_TARGETS[client] || 0}
          blogTarget={blogTargets[client] || 0}
          blogCount={blogs[client] || 0}
          weekLabel={WEEK_RANGES[wk].label}
          weekData={weekByClient[client]}
        />
      ))}
    </>
  );
}
