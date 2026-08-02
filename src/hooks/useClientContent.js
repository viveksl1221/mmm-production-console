import { useState } from 'react';
import { DATA } from '../data/campaign.js';

// Manages editable post content (topic/hook/format/week) per client.
//
// This is local-only for now — state lives in memory and resets on reload,
// seeded from the static campaign data. It's shaped so the next step (wiring
// this to a Supabase `posts` table) is a swap inside these functions, not a
// rewrite of the components that call them.
export function useClientContent() {
  const [itemsByClient, setItemsByClient] = useState(() => {
    const seeded = {};
    Object.keys(DATA).forEach((client) => {
      seeded[client] = DATA[client].map((item) => ({ ...item }));
    });
    return seeded;
  });

  function getItems(client) {
    return itemsByClient[client] || [];
  }

  function updateItem(client, num, patch) {
    setItemsByClient((prev) => ({
      ...prev,
      [client]: (prev[client] || []).map((it) => (it.num === num ? { ...it, ...patch } : it)),
    }));
  }

  function addItem(client) {
    setItemsByClient((prev) => {
      const list = prev[client] || [];
      const num = list.length ? Math.max(...list.map((it) => it.num)) + 1 : 1;
      const newItem = { num, week: 1, format: 'Static', topic: '', hook: '' };
      return { ...prev, [client]: [...list, newItem] };
    });
  }

  function removeItem(client, num) {
    setItemsByClient((prev) => ({
      ...prev,
      [client]: (prev[client] || []).filter((it) => it.num !== num),
    }));
  }

  return { getItems, updateItem, addItem, removeItem };
}
