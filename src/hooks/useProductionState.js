import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { postKey } from '../lib/derived.js';

// Loads/saves post status + blog counts/targets from Supabase, and keeps
// local state in sync with teammates' changes via realtime subscriptions.
// blogTargets only holds explicit overrides (client -> number); a client
// with no override simply isn't a key here — see effectiveBlogTargets in
// derived.js for how that merges with the campaign.js defaults.
export function useProductionState(userId) {
  const [posts, setPosts] = useState({}); // "Client::num" -> status
  const [blogs, setBlogs] = useState({}); // client -> count
  const [blogTargets, setBlogTargets] = useState({}); // client -> target override
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [postRes, blogRes] = await Promise.all([
          supabase.from('post_status').select('client, post_num, status'),
          supabase.from('blog_counts').select('client, count, target'),
        ]);
        if (cancelled) return;

        const nextPosts = {};
        (postRes.data || []).forEach((row) => {
          nextPosts[postKey(row.client, row.post_num)] = row.status;
        });
        const nextBlogs = {};
        const nextTargets = {};
        (blogRes.data || []).forEach((row) => {
          nextBlogs[row.client] = row.count;
          if (row.target != null) nextTargets[row.client] = row.target;
        });

        setPosts(nextPosts);
        setBlogs(nextBlogs);
        setBlogTargets(nextTargets);
      } catch (err) {
        if (!cancelled) console.error('Failed to load production state:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          loadedRef.current = true;
        }
      }
    }

    load();

    const channel = supabase
      .channel('production-console')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_status' }, (payload) => {
        const row = payload.new && Object.keys(payload.new).length ? payload.new : payload.old;
        if (!row) return;
        setPosts((prev) => {
          if (payload.eventType === 'DELETE') {
            const next = { ...prev };
            delete next[postKey(row.client, row.post_num)];
            return next;
          }
          return { ...prev, [postKey(row.client, row.post_num)]: row.status };
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_counts' }, (payload) => {
        const row = payload.new && Object.keys(payload.new).length ? payload.new : payload.old;
        if (!row) return;
        if (payload.eventType === 'DELETE') {
          setBlogs((prev) => {
            const next = { ...prev };
            delete next[row.client];
            return next;
          });
          setBlogTargets((prev) => {
            const next = { ...prev };
            delete next[row.client];
            return next;
          });
          return;
        }
        setBlogs((prev) => ({ ...prev, [row.client]: row.count }));
        setBlogTargets((prev) => {
          if (row.target == null) {
            if (!(row.client in prev)) return prev;
            const next = { ...prev };
            delete next[row.client];
            return next;
          }
          return { ...prev, [row.client]: row.target };
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  async function setPostStatus(client, num, status) {
    const key = postKey(client, num);
    setPosts((prev) => ({ ...prev, [key]: status }));
    await supabase.from('post_status').upsert({
      client,
      post_num: num,
      status,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    });
  }

  async function setBlogCount(client, count) {
    setBlogs((prev) => ({ ...prev, [client]: count }));
    await supabase.from('blog_counts').upsert({
      client,
      count,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    });
  }

  async function setBlogTarget(client, target) {
    setBlogTargets((prev) => ({ ...prev, [client]: target }));
    // count defaults to 0 on first insert for a client with no row yet —
    // upsert only sets the columns listed here, so an existing count is
    // left untouched.
    await supabase.from('blog_counts').upsert({
      client,
      target,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    });
  }

  return { posts, blogs, blogTargets, loading, setPostStatus, setBlogCount, setBlogTarget };
}
