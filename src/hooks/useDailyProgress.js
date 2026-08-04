import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

function keyOf(client, num) {
  return `${client}::${num}`;
}

function rowToEntry(row) {
  return {
    status: row.status,
    elapsedSeconds: row.elapsed_seconds || 0,
    startedAt: row.started_at ? new Date(row.started_at).getTime() : null,
  };
}

// Loads/saves today's checklist progress from Supabase's `daily_progress`
// table, scoped to a single work_date so each day starts fresh. Each entry
// also carries a per-item timer: elapsedSeconds is the banked total, and
// startedAt (epoch ms, local clock) is set only while the timer is running —
// UI reads it back with local-timezone formatting, so "started at" always
// matches the studio's wall clock rather than server/UTC time.
export function useDailyProgress(workDate, userId) {
  const [progressByKey, setProgressByKey] = useState({});
  const [loading, setLoading] = useState(true);
  // Event handlers below run outside render, so they read the latest state
  // via this ref rather than a closure — mirrors the fix for the earlier
  // stale-closure bug in useClientContent's updateItem.
  const ref = useRef(progressByKey);
  ref.current = progressByKey;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const { data } = await supabase
          .from('daily_progress')
          .select('client, num, status, started_at, elapsed_seconds')
          .eq('work_date', workDate);
        if (cancelled) return;
        const next = {};
        (data || []).forEach((row) => {
          next[keyOf(row.client, row.num)] = rowToEntry(row);
        });
        setProgressByKey(next);
      } catch (err) {
        if (!cancelled) console.error('Failed to load daily progress:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel(`daily-progress-${workDate}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_progress', filter: `work_date=eq.${workDate}` },
        (payload) => {
          const row = payload.new && Object.keys(payload.new).length ? payload.new : payload.old;
          if (!row) return;
          setProgressByKey((prev) => ({ ...prev, [keyOf(row.client, row.num)]: rowToEntry(row) }));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [workDate]);

  async function persist(client, num, entry) {
    await supabase.from('daily_progress').upsert({
      client,
      num,
      work_date: workDate,
      status: entry.status,
      started_at: entry.startedAt ? new Date(entry.startedAt).toISOString() : null,
      elapsed_seconds: entry.elapsedSeconds,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    });
  }

  function apply(client, num, entry) {
    setProgressByKey((prev) => ({ ...prev, [keyOf(client, num)]: entry }));
    persist(client, num, entry);
  }

  // Turns the timer on. If the item already has banked time (e.g. resuming
  // after a pause), that time is kept and the clock keeps counting up from it.
  function startTimer(client, num) {
    const cur = ref.current[keyOf(client, num)];
    apply(client, num, { status: 'in_progress', elapsedSeconds: cur?.elapsedSeconds || 0, startedAt: Date.now() });
  }

  // Freezes the running timer, banking the elapsed run into elapsedSeconds.
  function pauseTimer(client, num) {
    const cur = ref.current[keyOf(client, num)];
    if (!cur || !cur.startedAt) return;
    const banked = (cur.elapsedSeconds || 0) + Math.floor((Date.now() - cur.startedAt) / 1000);
    apply(client, num, { status: 'in_progress', elapsedSeconds: banked, startedAt: null });
  }

  // Marks the item done and stops the timer, banking any time still running.
  function completeItem(client, num) {
    const cur = ref.current[keyOf(client, num)];
    const extra = cur?.startedAt ? Math.floor((Date.now() - cur.startedAt) / 1000) : 0;
    apply(client, num, { status: 'completed', elapsedSeconds: (cur?.elapsedSeconds || 0) + extra, startedAt: null });
  }

  // Reopens a completed item, or clears a not-started-yet timer, to a clean slate.
  function resetItem(client, num) {
    apply(client, num, { status: 'not_started', elapsedSeconds: 0, startedAt: null });
  }

  return { progressByKey, loading, startTimer, pauseTimer, completeItem, resetItem };
}
