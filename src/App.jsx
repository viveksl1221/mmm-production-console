import { useState } from 'react';
import { LoginScreen } from './components/AuthGate.jsx';
import ClientsTab from './components/ClientsTab.jsx';
import OverviewTab from './components/OverviewTab.jsx';
import PageHeader from './components/PageHeader.jsx';
import Sidebar from './components/Sidebar.jsx';
import WeeklyTab from './components/WeeklyTab.jsx';
import { useAuth } from './hooks/useAuth.js';
import { useProductionState } from './hooks/useProductionState.js';
import { totalShipped, totalTargets } from './lib/derived.js';

function Console({ userId, onSignOut }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [openWeeks, setOpenWeeks] = useState({});
  const [openClients, setOpenClients] = useState({});
  const [navRequest, setNavRequest] = useState(null);
  const { posts, blogs, loading, setPostStatus, setBlogCount } = useProductionState(userId);

  function gotoWeek(w) {
    setActiveTab('weekly');
    setNavRequest({ type: 'week', week: w, at: Date.now() });
  }
  function gotoClient(name) {
    setActiveTab('clients');
    setNavRequest({ type: 'client', client: name, at: Date.now() });
  }

  return (
    <div id="console-root">
      <Sidebar
        active={activeTab}
        onChange={setActiveTab}
        shipped={totalShipped(posts, blogs)}
        target={totalTargets()}
        showSignOut={!!onSignOut}
        onSignOut={onSignOut}
      />
      <main className="main">
        <PageHeader active={activeTab} />
        <div className="main-scroll">
          {loading ? (
            <div className="loading-state">Loading…</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewTab posts={posts} blogs={blogs} onGotoWeek={gotoWeek} onGotoClient={gotoClient} />
              )}
              {activeTab === 'weekly' && (
                <WeeklyTab
                  posts={posts}
                  openWeeks={openWeeks}
                  setOpenWeeks={setOpenWeeks}
                  navRequest={navRequest?.type === 'week' ? navRequest : null}
                />
              )}
              {activeTab === 'clients' && (
                <ClientsTab
                  posts={posts}
                  blogs={blogs}
                  setPostStatus={setPostStatus}
                  setBlogCount={setBlogCount}
                  openClients={openClients}
                  setOpenClients={setOpenClients}
                  navRequest={navRequest?.type === 'client' ? navRequest : null}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Set VITE_REQUIRE_AUTH=false to skip the magic-link gate entirely — useful while
// getting the Supabase project stood up. Flip it back to require sign-in once
// you're ready to invite the team (see supabase/schema.sql for the matching RLS change).
const AUTH_REQUIRED = import.meta.env.VITE_REQUIRE_AUTH !== 'false';

export default function App() {
  const { session, loading, signOut } = useAuth();

  if (!AUTH_REQUIRED) {
    return <Console userId={session?.user?.id ?? null} onSignOut={null} />;
  }

  if (loading) return null;
  if (!session) return <LoginScreen />;

  return <Console userId={session.user.id} onSignOut={signOut} />;
}
