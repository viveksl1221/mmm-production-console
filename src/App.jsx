import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { LoginScreen } from './components/AuthGate.jsx';
import AssistantWidget from './components/AssistantWidget.jsx';
import BlogPage from './components/BlogPage.jsx';
import ChatPage from './components/ChatPage.jsx';
import ClientPage from './components/ClientPage.jsx';
import ClientsTab from './components/ClientsTab.jsx';
import CommentsPage from './components/CommentsPage.jsx';
import FeedbackWidget from './components/FeedbackWidget.jsx';
import OverviewTab from './components/OverviewTab.jsx';
import PageHeader from './components/PageHeader.jsx';
import ReportsPage from './components/ReportsPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import TodayPage from './components/TodayPage.jsx';
import WeeklyTab from './components/WeeklyTab.jsx';
import { useAuth } from './hooks/useAuth.js';
import { useClientContent } from './hooks/useClientContent.js';
import { useProductionState } from './hooks/useProductionState.js';
import { computeBlogPerWeek, effectiveBlogTargets, totalShipped, totalTargets } from './lib/derived.js';

function ConsoleLayout({ userId, onSignOut }) {
  const { posts, blogs, blogTargets, loading, setPostStatus, setBlogCount, setBlogTarget } = useProductionState(userId);
  const content = useClientContent(userId);
  const location = useLocation();
  const showFeedbackWidget = location.pathname !== '/comments';
  const showAssistantWidget = location.pathname !== '/assistant';

  // The campaign.js defaults merged with any live per-client overrides —
  // computed once here so every page reads the same numbers instead of
  // each recomputing (and potentially drifting) its own merge.
  const effectiveTargets = effectiveBlogTargets(blogTargets);
  const blogPerWeek = computeBlogPerWeek(effectiveTargets);

  return (
    <div id="console-root">
      <Sidebar
        shipped={totalShipped(posts, blogs)}
        target={totalTargets(effectiveTargets)}
        showSignOut={!!onSignOut}
        onSignOut={onSignOut}
      />
      <main className="main">
        <PageHeader posts={posts} blogs={blogs} content={content} blogTargets={effectiveTargets} />
        <div className="main-scroll">
          {loading || content.loading ? (
            <div className="loading-state">Loading…</div>
          ) : (
            <Outlet context={{
              posts, blogs, setPostStatus, setBlogCount, content, userId,
              blogTargets: effectiveTargets, setBlogTarget, blogPerWeek,
            }} />
          )}
        </div>
      </main>
      {showFeedbackWidget && <FeedbackWidget userId={userId} />}
      {showAssistantWidget && <AssistantWidget />}
    </div>
  );
}

// Set VITE_REQUIRE_AUTH=false to skip the magic-link gate entirely — useful while
// getting the Supabase project stood up. Flip it back to require sign-in once
// you're ready to invite the team (see supabase/schema.sql for the matching RLS change).
const AUTH_REQUIRED = import.meta.env.VITE_REQUIRE_AUTH !== 'false';

export default function App() {
  const { session, loading, signOut } = useAuth();

  if (AUTH_REQUIRED) {
    if (loading) return null;
    if (!session) return <LoginScreen />;
  }

  const userId = AUTH_REQUIRED ? session.user.id : (session?.user?.id ?? null);
  const onSignOut = AUTH_REQUIRED ? signOut : null;

  return (
    <Routes>
      <Route path="/" element={<ConsoleLayout userId={userId} onSignOut={onSignOut} />}>
        <Route index element={<OverviewTab />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="weekly" element={<WeeklyTab />} />
        <Route path="clients" element={<ClientsTab />} />
        <Route path="clients/:clientSlug" element={<ClientPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="comments" element={<CommentsPage />} />
        <Route path="assistant" element={<ChatPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
