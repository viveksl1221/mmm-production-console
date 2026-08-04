import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

function rowToTask(row) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    elapsedSeconds: row.elapsed_seconds || 0,
    startedAt: row.started_at ? new Date(row.started_at).getTime() : null,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

// Ad-hoc tasks that live outside the content calendar entirely (see
// extra_tasks migration) — same start/pause/complete timer shape as
// daily_progress, but each task is its own row rather than being scoped to
// a work_date, since these persist until done instead of resetting daily.
export function useExtraTasks(userId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(tasks);
  ref.current = tasks;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await supabase.from('extra_tasks').select('*').order('created_at', { ascending: true });
        if (cancelled) return;
        setTasks((data || []).map(rowToTask));
      } catch (err) {
        if (!cancelled) console.error('Failed to load additional tasks:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel('extra-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'extra_tasks' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          return;
        }
        const task = rowToTask(payload.new);
        setTasks((prev) => {
          const idx = prev.findIndex((t) => t.id === task.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = task;
            return next;
          }
          return [...prev, task];
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  async function addTask(title) {
    const { data } = await supabase.from('extra_tasks').insert({ title, created_by: userId }).select().single();
    if (data) setTasks((prev) => [...prev, rowToTask(data)]);
  }

  async function persist(id, patch) {
    await supabase.from('extra_tasks').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  }

  function startTimer(id) {
    const cur = ref.current.find((t) => t.id === id);
    const elapsedSeconds = cur?.elapsedSeconds || 0;
    const startedAt = Date.now();
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'in_progress', elapsedSeconds, startedAt } : t)));
    persist(id, { status: 'in_progress', elapsed_seconds: elapsedSeconds, started_at: new Date(startedAt).toISOString() });
  }

  function pauseTimer(id) {
    const cur = ref.current.find((t) => t.id === id);
    if (!cur || !cur.startedAt) return;
    const banked = (cur.elapsedSeconds || 0) + Math.floor((Date.now() - cur.startedAt) / 1000);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, elapsedSeconds: banked, startedAt: null } : t)));
    persist(id, { status: 'in_progress', elapsed_seconds: banked, started_at: null });
  }

  function completeItem(id) {
    const cur = ref.current.find((t) => t.id === id);
    const extra = cur?.startedAt ? Math.floor((Date.now() - cur.startedAt) / 1000) : 0;
    const banked = (cur?.elapsedSeconds || 0) + extra;
    const completedAt = new Date().toISOString();
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'completed', elapsedSeconds: banked, startedAt: null, completedAt } : t)));
    persist(id, { status: 'completed', elapsed_seconds: banked, started_at: null, completed_at: completedAt });
  }

  function resetItem(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'not_started', elapsedSeconds: 0, startedAt: null, completedAt: null } : t)));
    persist(id, { status: 'not_started', elapsed_seconds: 0, started_at: null, completed_at: null });
  }

  async function removeTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('extra_tasks').delete().eq('id', id);
  }

  return { tasks, loading, addTask, startTimer, pauseTimer, completeItem, resetItem, removeTask };
}
