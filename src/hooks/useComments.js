import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

// Loads/saves the open comment board from Supabase's `comments` table, kept
// newest-first, synced live across tabs the same way the other content
// hooks are (see useClientContent).
export function useComments(userId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await supabase.from('comments').select('*').order('created_at', { ascending: false });
        if (cancelled) return;
        setComments(data || []);
      } catch (err) {
        if (!cancelled) console.error('Failed to load comments:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel('comments-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setComments((prev) => (prev.some((c) => c.id === payload.new.id) ? prev : [payload.new, ...prev]));
        } else if (payload.eventType === 'DELETE') {
          setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  async function addComment(authorName, message) {
    const optimistic = {
      id: `local-${Date.now()}`,
      author_name: authorName,
      message,
      created_by: userId,
      created_at: new Date().toISOString(),
    };
    setComments((prev) => [optimistic, ...prev]);
    const { data } = await supabase
      .from('comments')
      .insert({ author_name: authorName, message, created_by: userId })
      .select()
      .single();
    if (data) {
      setComments((prev) => prev.map((c) => (c.id === optimistic.id ? data : c)));
    }
  }

  async function removeComment(id) {
    setComments((prev) => prev.filter((c) => c.id !== id));
    await supabase.from('comments').delete().eq('id', id);
  }

  return { comments, loading, addComment, removeComment };
}
