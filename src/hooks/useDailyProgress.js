import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

function keyOf(workDate, client, num) {
  return `${workDate}::${client}::${num}`;
}

function rowToEntry(row) {
  return {
    status: row.status,
    elapsedSeconds: row.elapsed_seconds || 0,
    startedAt: row.started_at ? new Date(row.started_at).getTime() : null,
  };
}

// Loads/saves checklist progress from Supabase's `daily_progress` table for
// a date range [startDate, endDate] (inclusive), keyed by
// "workDate::client::num" so the same item can be tracked independently on
// different days (e.g. Tuesday's Carousel work vs. a Friday review pass) —
// this is what lets Today's Batch show unfinished earlier-in-the-week items
// as "carried over" without losing track of which day they were originally
// due. Pass the same date for both bounds to fetch a single day.
export function useDailyProgress(startDate, endDate, userId) {
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
          .select('client, num, work_date, status, started_at, elapsed_seconds')
          .gte('work_date', startDate)
          .lte('work_date', endDate);
        if (cancelled) return;
        const next = {};
        (data || []).forEach((row) => {
          next[keyOf(row.work_date, row.client, row.num)] = rowToEntry(row);
        });
        setProgressByKey(next);
      } catch (err) {
        if (!cancelled) console.error('Failed to load daily progress:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // postgres_changes filters only support simple equality, not a range,
    // so this subscribes unfiltered and drops anything outside the window.
    const channel = supabase
      .channel(`daily-progress-${startDate}-${endDate}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_progress' }, (payload) => {
        const row = payload.new && Object.keys(payload.new).length ? payload.new : payload.old;
        if (!row || row.work_date < startDate || row.work_date > endDate) return;
        setProgressByKey((prev) => ({ ...prev, [keyOf(row.work_date, row.client, row.num)]: rowToEntry(row) }));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [startDate, endDate]);

  async function persist(client, num, workDate, entry) {
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

  function apply(client, num, workDate, entry) {
    setProgressByKey((prev) => ({ ...prev, [keyOf(workDate, client, num)]: entry }));
    persist(client, num, workDate, entry);
  }

  // Turns the timer on. If the item already has banked time (e.g. resuming
  // after a pause), that time is kept and the clock keeps counting up from it.
  function startTimer(client, num, workDate) {
    const cur = ref.current[keyOf(workDate, client, num)];
    apply(client, num, workDate, { status: 'in_progress', elapsedSeconds: cur?.elapsedSeconds || 0, startedAt: Date.now() });
  }

  // Freezes the running timer, banking the elapsed run into elapsedSeconds.
  function pauseTimer(client, num, workDate) {
    const cur = ref.current[keyOf(workDate, client, num)];
    if (!cur || !cur.startedAt) return;
    const banked = (cur.elapsedSeconds || 0) + Math.floor((Date.now() - cur.startedAt) / 1000);
    apply(client, num, workDate, { status: 'in_progress', elapsedSeconds: banked, startedAt: null });
  }

  // Marks the item done and stops the timer, banking any time still running.
  function completeItem(client, num, workDate) {
    const cur = ref.current[keyOf(workDate, client, num)];
    const extra = cur?.startedAt ? Math.floor((Date.now() - cur.startedAt) / 1000) : 0;
    apply(client, num, workDate, { status: 'completed', elapsedSeconds: (cur?.elapsedSeconds || 0) + extra, startedAt: null });
  }

  // Reopens a completed item, or clears a not-started-yet timer, to a clean slate.
  function resetItem(client, num, workDate) {
    apply(client, num, workDate, { status: 'not_started', elapsedSeconds: 0, startedAt: null });
  }

  return { progressByKey, loading, startTimer, pauseTimer, completeItem, resetItem };
}
