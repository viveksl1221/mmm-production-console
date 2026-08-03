// One-off script: seeds a starter content plan for Fika Time Sushi (10 posts,
// matching its monthly target). Draft placeholder topics for review/editing —
// not final copy. Run once: node supabase/seed-fika-sushi.mjs

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  const env = {};
  raw.split('\n').forEach((line) => {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  });
  return env;
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const CLIENT = 'Fika Time Sushi';

// Mirrors Fika Time's own data shape: platform + format + pillar + topic,
// audience/funnel/hook left blank (that client doesn't use them).
const items = [
  { num: 1, week: 1, format: 'Reel', pillar: 'Craftsmanship', topic: 'Fresh Rolls, Made to Order' },
  { num: 2, week: 1, format: 'Static', pillar: 'Craftsmanship', topic: "Our Sushi Chef's Daily Ritual" },
  { num: 3, week: 2, format: 'Carousel', pillar: 'Menu Highlight', topic: 'Inside Our Sushi Selection' },
  { num: 4, week: 2, format: 'Reel', pillar: 'Behind the Scenes', topic: 'Behind the Sushi Counter' },
  { num: 5, week: 3, format: 'Static', pillar: 'Pairing', topic: "Pairing Sushi with Fika's Coffee" },
  { num: 6, week: 3, format: 'Carousel', pillar: 'Menu Highlight', topic: '5 Rolls You Need to Try' },
  { num: 7, week: 4, format: 'Reel', pillar: 'Behind the Scenes', topic: 'A Day in the Sushi Kitchen' },
  { num: 8, week: 4, format: 'Static', pillar: 'Craftsmanship', topic: 'Quality You Can Taste' },
  { num: 9, week: 4, format: 'Carousel', pillar: 'Community', topic: 'Sushi Night at Fika Time' },
  { num: 10, week: 4, format: 'Reel', pillar: 'Behind the Scenes', topic: 'Meet the Sushi Team' },
];

function toRow(item) {
  return {
    client: CLIENT,
    num: item.num,
    week: item.week,
    platform: 'Instagram',
    format: item.format,
    audience: '',
    funnel: '',
    pillar: item.pillar,
    topic: item.topic,
    hook: '',
    breakdown: '',
    visual_direction: '',
    cta: '',
    assignee: '',
    date: '',
    notes: '',
    reference_links: [],
  };
}

const { error, count } = await supabase.from('posts').upsert(items.map(toRow), { count: 'exact' });
if (error) {
  console.error('Failed:', error);
  process.exit(1);
}
console.log(`Seeded ${count ?? items.length} posts for ${CLIENT}.`);
