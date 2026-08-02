import { useState } from 'react';
import { LoginScreen } from './components/AuthGate.jsx';
import ClientsTab from './components/ClientsTab.jsx';
import OverviewTab from './components/OverviewTab.jsx';
import TabNav from './components/TabNav.jsx';
import TopBar from './components/TopBar.jsx';
import WeeklyTab from './components/WeeklyTab.jsx';
import { useAuth } from './hooks/useAuth.js';
import { useProductionState } from './hooks/useProductionState.js';

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
      <TopBar posts={posts} blogs={blogs} onSignOut={onSignOut} />
      <TabNav active={activeTab} onChange={setActiveTab} />

      {loading ? (
        <div className="scroll-area" style={{ color: '#8A8A8A', fontSize: 13 }}>Loading…</div>
      ) : (
        <>
          <div className={`tab-panel ${activeTab === 'overview' ? 'active' : ''}`}>
            <OverviewTab posts={posts} blogs={blogs} onGotoWeek={gotoWeek} onGotoClient={gotoClient} />
          </div>
          <div className={`tab-panel ${activeTab === 'weekly' ? 'active' : ''}`}>
            <WeeklyTab posts={posts} openWeeks={openWeeks} setOpenWeeks={setOpenWeeks} navRequest={navRequest?.type === 'week' ? navRequest : null} />
          </div>
          <div className={`tab-panel ${activeTab === 'clients' ? 'active' : ''}`}>
            <ClientsTab
              posts={posts}
              blogs={blogs}
              setPostStatus={setPostStatus}
              setBlogCount={setBlogCount}
              openClients={openClients}
              setOpenClients={setOpenClients}
              navRequest={navRequest?.type === 'client' ? navRequest : null}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const { session, loading, signOut } = useAuth();

  if (loading) return null;
  if (!session) return <LoginScreen />;

  return <Console userId={session.user.id} onSignOut={signOut} />;
}
