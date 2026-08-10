import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

function rowToKit(row) {
  return { colors: row.colors || [], fonts: row.fonts || [], notes: row.notes || '' };
}

const EMPTY_KIT = { colors: [], fonts: [], notes: '' };

// Loads/saves per-client brand kits (colors/fonts/notes) from Supabase's
// `brand_kits` table — same load + realtime-subscribe pattern as the
// other content hooks, just keyed by client instead of client+num.
export function useBrandKits(userId) {
  const [kits, setKits] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await supabase.from('brand_kits').select('*');
        if (cancelled) return;
        const next = {};
        (data || []).forEach((row) => {
          next[row.client] = rowToKit(row);
        });
        setKits(next);
      } catch (err) {
        if (!cancelled) console.error('Failed to load brand kits:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel('brand-kits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brand_kits' }, (payload) => {
        const row = payload.new && Object.keys(payload.new).length ? payload.new : payload.old;
        if (!row) return;
        if (payload.eventType === 'DELETE') {
          setKits((prev) => {
            const next = { ...prev };
            delete next[row.client];
            return next;
          });
          return;
        }
        setKits((prev) => ({ ...prev, [row.client]: rowToKit(row) }));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  function getKit(client) {
    return kits[client] || EMPTY_KIT;
  }

  async function saveKit(client, kit) {
    setKits((prev) => ({ ...prev, [client]: kit }));
    await supabase.from('brand_kits').upsert({
      client,
      colors: kit.colors,
      fonts: kit.fonts,
      notes: kit.notes,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    });
  }

  return { getKit, saveKit, loading };
}
