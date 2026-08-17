import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

// Loads/saves post content (topic/hook/format/week/etc.) from Supabase's
// `posts` table, and keeps local state in sync with teammates' changes via
// realtime subscriptions — same pattern as useProductionState.
//
// `references` in the app maps to the `reference_links` column (REFERENCES
// is a reserved word in SQL), and `visualDirection` maps to `visual_direction`.

function fromRow(row) {
  return {
    num: row.num,
    week: row.week,
    platform: row.platform,
    format: row.format,
    audience: row.audience,
    funnel: row.funnel,
    pillar: row.pillar,
    topic: row.topic,
    hook: row.hook,
    breakdown: row.breakdown,
    visualDirection: row.visual_direction,
    cta: row.cta,
    assignee: row.assignee,
    date: row.date,
    notes: row.notes,
    references: row.reference_links || [],
    assetUrl: row.asset_url || null,
  };
}

function toRow(client, item, userId) {
  return {
    client,
    num: item.num,
    week: item.week,
    platform: item.platform || '',
    format: item.format || '',
    audience: item.audience || '',
    funnel: item.funnel || '',
    pillar: item.pillar || '',
    topic: item.topic || '',
    hook: item.hook || '',
    breakdown: item.breakdown || '',
    visual_direction: item.visualDirection || '',
    cta: item.cta || '',
    assignee: item.assignee || '',
    date: item.date || '',
    notes: item.notes || '',
    reference_links: item.references || [],
    asset_url: item.assetUrl || null,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };
}

function blankItem(num) {
  return {
    num, week: 1, platform: 'Instagram', format: 'Static', audience: '', funnel: '', pillar: '',
    topic: '', hook: '', breakdown: '', visualDirection: '', cta: '',
    assignee: '', date: '', notes: '', references: [], assetUrl: null,
  };
}

export function useClientContent(userId) {
  const [itemsByClient, setItemsByClient] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await supabase.from('posts').select('*');
        if (cancelled) return;
        const grouped = {};
        (data || []).forEach((row) => {
          (grouped[row.client] ||= []).push(fromRow(row));
        });
        Object.values(grouped).forEach((list) => list.sort((a, b) => a.num - b.num));
        setItemsByClient(grouped);
      } catch (err) {
        if (!cancelled) console.error('Failed to load post content:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel('post-content')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        const row = payload.new && Object.keys(payload.new).length ? payload.new : payload.old;
        if (!row) return;
        setItemsByClient((prev) => {
          const list = prev[row.client] ? [...prev[row.client]] : [];
          const idx = list.findIndex((it) => it.num === row.num);
          if (payload.eventType === 'DELETE') {
            if (idx >= 0) list.splice(idx, 1);
          } else {
            const item = fromRow(row);
            if (idx >= 0) list[idx] = item; else list.push(item);
            list.sort((a, b) => a.num - b.num);
          }
          return { ...prev, [row.client]: list };
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  function getItems(client) {
    return itemsByClient[client] || [];
  }

  async function updateItem(client, num, patch) {
    const current = (itemsByClient[client] || []).find((it) => it.num === num);
    if (!current) return;
    const merged = { ...current, ...patch };
    setItemsByClient((prev) => ({
      ...prev,
      [client]: (prev[client] || []).map((it) => (it.num === num ? merged : it)),
    }));
    await supabase.from('posts').upsert(toRow(client, merged, userId));
  }

  async function addItem(client) {
    const list = itemsByClient[client] || [];
    const num = list.length ? Math.max(...list.map((it) => it.num)) + 1 : 1;
    const newItem = blankItem(num);
    setItemsByClient((prev) => ({ ...prev, [client]: [...(prev[client] || []), newItem] }));
    await supabase.from('posts').upsert(toRow(client, newItem, userId));
  }

  async function removeItem(client, num) {
    setItemsByClient((prev) => ({ ...prev, [client]: (prev[client] || []).filter((it) => it.num !== num) }));
    await supabase.from('posts').delete().eq('client', client).eq('num', num);
  }

  // Upserts imported items into a client's list, matched by Post # (num).
  // Additive only — never removes rows missing from the imported set.
  async function importItems(client, items) {
    const list = itemsByClient[client] || [];
    const byNum = new Map(list.map((it) => [it.num, it]));
    items.forEach((incoming) => {
      const cur = byNum.get(incoming.num);
      byNum.set(incoming.num, cur ? { ...cur, ...incoming } : incoming);
    });
    const merged = Array.from(byNum.values()).sort((a, b) => a.num - b.num);
    setItemsByClient((prev) => ({ ...prev, [client]: merged }));

    const rows = items.map((incoming) => {
      const cur = byNum.get(incoming.num);
      return toRow(client, cur, userId);
    });
    await supabase.from('posts').upsert(rows);
  }

  // Like importItems, but treats the incoming set as the client's complete
  // new list — any existing Post # not present in `items` is deleted
  // (posts row + its post_status row), instead of being left alone.
  async function replaceItems(client, items) {
    const existing = itemsByClient[client] || [];
    const incomingNums = new Set(items.map((it) => it.num));
    const removedNums = existing.filter((it) => !incomingNums.has(it.num)).map((it) => it.num);

    setItemsByClient((prev) => ({ ...prev, [client]: [...items].sort((a, b) => a.num - b.num) }));

    if (removedNums.length) {
      await supabase.from('posts').delete().eq('client', client).in('num', removedNums);
      await supabase.from('post_status').delete().eq('client', client).in('post_num', removedNums);
    }
    const rows = items.map((item) => toRow(client, item, userId));
    await supabase.from('posts').upsert(rows);
  }

  return { getItems, updateItem, addItem, removeItem, importItems, replaceItems, loading, itemsByClient };
}
