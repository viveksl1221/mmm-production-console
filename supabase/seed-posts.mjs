// One-time script: loads src/data/campaign.js's DATA and upserts it into
// the `posts` table. Run once after applying schema.sql to a fresh project
// (or any time you want to reset `posts` back to the campaign.js baseline).
//
// Usage: node supabase/seed-posts.mjs
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env in the project root.

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { DATA } from '../src/data/campaign.js';

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

function toRow(client, item) {
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
  };
}

const rows = Object.entries(DATA).flatMap(([client, items]) => items.map((it) => toRow(client, it)));

console.log(`Seeding ${rows.length} posts across ${Object.keys(DATA).length} clients...`);

const { error, count } = await supabase.from('posts').upsert(rows, { count: 'exact' });

if (error) {
  console.error('Seed failed:', error);
  process.exit(1);
}

console.log(`Done. Upserted ${count ?? rows.length} rows.`);
