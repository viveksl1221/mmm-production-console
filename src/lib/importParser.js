// Fields a spreadsheet column can be mapped to. 'reference' is special: each
// mapped reference column becomes one entry in the item's `references` list
// (labeled with that column's own header), so multiple link/music columns
// per sheet (like Fika Time's Reference / Reference.1 / Music) all come
// through without needing dedicated columns for each.
export const FIELD_OPTIONS = [
  { key: 'ignore', label: 'Ignore this column' },
  { key: 'num', label: 'Post #' },
  { key: 'week', label: 'Week' },
  { key: 'platform', label: 'Platform' },
  { key: 'format', label: 'Format' },
  { key: 'audience', label: 'Audience' },
  { key: 'funnel', label: 'Funnel stage' },
  { key: 'pillar', label: 'Pillar / Campaign' },
  { key: 'topic', label: 'Topic' },
  { key: 'hook', label: 'Hook' },
  { key: 'breakdown', label: 'Slide/Reel breakdown' },
  { key: 'visualDirection', label: 'Visual direction' },
  { key: 'cta', label: 'CTA' },
  { key: 'status', label: 'Status' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'date', label: 'Date' },
  { key: 'notes', label: 'Notes' },
  { key: 'reference', label: 'Reference link' },
];

const FIELD_ALIASES = {
  num: ['post', 'postno', 'postnum', 'postnumber'],
  week: ['week'],
  platform: ['platform'],
  format: ['format'],
  audience: ['audience'],
  funnel: ['funnel', 'funnelstage'],
  pillar: ['pillar', 'campaign', 'campaignpillar'],
  topic: ['topic', 'contentidea', 'idea'],
  hook: ['hook'],
  breakdown: ['breakdown', 'slidereelbreakdown', 'slide'],
  visualDirection: ['visualdirection', 'visual'],
  cta: ['cta'],
  status: ['status'],
  assignee: ['assignee', 'owner'],
  date: ['date'],
  notes: ['notes', 'objective'],
  reference: ['reference', 'music', 'link', 'url'],
};

function normalize(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function guessFieldForHeader(header) {
  const norm = normalize(header);
  if (!norm) return 'ignore';
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((a) => norm.includes(a))) return field;
  }
  return 'ignore';
}

// Sheets that mirror what the app already computes live (rollups/dashboards)
// rather than being a source of new post content.
const SKIP_SHEET_PATTERNS = ['dashboard', 'allcontent', 'summary'];

export function guessClientForSheet(sheetName, allClients) {
  const norm = normalize(sheetName);
  if (SKIP_SHEET_PATTERNS.some((p) => norm.includes(p))) return null;
  const exact = allClients.find((c) => normalize(c) === norm);
  if (exact) return exact;
  return allClients.find((c) => norm.includes(normalize(c)) || normalize(c).includes(norm)) || null;
}

// Reads a File (.xlsx or .csv) and returns one entry per sheet:
// { sheetName, headerRow, dataRows }. CSV files parse as a single sheet.
export async function parseWorkbookFile(file) {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  return wb.SheetNames.map((sheetName) => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
    const headerRow = rows[0] || [];
    const dataRows = rows.slice(1).filter((r) => r.some((cell) => String(cell ?? '').trim() !== ''));
    return { sheetName, headerRow, dataRows };
  });
}

function blankItem() {
  return {
    num: null, week: 1, platform: '', format: '', audience: '', funnel: '', pillar: '',
    topic: '', hook: '', breakdown: '', visualDirection: '', cta: '',
    assignee: '', date: '', notes: '', references: [],
  };
}

// Status isn't part of the content item shape (see campaign.js) — it's
// tracked separately via useProductionState. A mapped Status column comes
// back as item._status (an ephemeral field, stripped before the item is
// stored) so the caller can feed it into that separate pipeline instead.
const KNOWN_STATUSES = ['Planned', 'Drafted', 'Sent to Client', 'Scheduled', 'Published'];

export function normalizeStatus(raw) {
  const cleaned = String(raw || '').replace(/[^a-zA-Z\s]/g, '').trim().toLowerCase();
  return KNOWN_STATUSES.find((s) => s.toLowerCase() === cleaned) || null;
}

// columnMapping: array parallel to headerRow, one FIELD_OPTIONS key per column.
export function rowsToItems(headerRow, dataRows, columnMapping) {
  return dataRows.map((r, i) => {
    const item = blankItem();
    const refs = [];
    let statusRaw = null;
    columnMapping.forEach((field, colIdx) => {
      if (!field || field === 'ignore') return;
      const raw = r[colIdx];
      const val = raw == null ? '' : String(raw).trim();
      if (!val) return;
      if (field === 'reference') {
        refs.push({ label: String(headerRow[colIdx] || 'Reference').trim(), url: val });
      } else if (field === 'num') {
        item.num = parseInt(val, 10) || null;
      } else if (field === 'week') {
        item.week = parseInt(String(val).replace(/[^0-9]/g, ''), 10) || 1;
      } else if (field === 'status') {
        statusRaw = val;
      } else {
        item[field] = val;
      }
    });
    item.references = refs;
    if (item.num == null) item.num = i + 1;
    if (statusRaw) item._status = normalizeStatus(statusRaw);
    return item;
  });
}

function normalizeTopic(t) {
  return String(t || '').trim().toLowerCase();
}

// For sheets with no explicit Post # column (e.g. Fika Time), rowsToItems
// assigns sequential numbers starting at 1 — which won't line up with
// existing session data. This re-keys incoming items to reuse an existing
// item's num when the topic text matches exactly, and only assigns a fresh
// number (continuing past the client's current max) for genuinely new rows.
export function reconcileNumbersByTopic(items, existing) {
  const existingByTopic = new Map(existing.map((it) => [normalizeTopic(it.topic), it.num]));
  let nextNum = existing.length ? Math.max(...existing.map((it) => it.num)) + 1 : 1;
  return items.map((it) => {
    const matchedNum = existingByTopic.get(normalizeTopic(it.topic));
    return { ...it, num: matchedNum != null ? matchedNum : nextNum++ };
  });
}

// Compares incoming (imported) items against existing session items for a
// client, matched by Post #. Never proposes deletions — rows missing from
// the imported file are simply left alone.
export function diffItems(existing, incoming) {
  const existingByNum = new Map(existing.map((it) => [it.num, it]));
  const added = [];
  const changed = [];
  const unchanged = [];

  incoming.forEach((inItem) => {
    const cur = existingByNum.get(inItem.num);
    if (!cur) {
      added.push(inItem);
      return;
    }
    const fieldsChanged = Object.keys(inItem).filter((k) => {
      if (k === 'references') return JSON.stringify(cur.references || []) !== JSON.stringify(inItem.references || []);
      return String(cur[k] ?? '') !== String(inItem[k] ?? '');
    });
    if (fieldsChanged.length) changed.push({ item: inItem, fieldsChanged, previous: cur });
    else unchanged.push(inItem);
  });

  return { added, changed, unchanged };
}
