import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export function useAuth() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    session,
    loading: session === undefined,
    signOut: () => supabase.auth.signOut(),
  };
}
