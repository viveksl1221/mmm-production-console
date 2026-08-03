// Mirrors the import column set (see importParser.js) so a round-trip
// export -> edit -> import lines up cleanly.
const EXPORT_COLUMNS = [
  { key: 'num', label: 'Post #' },
  { key: 'week', label: 'Week' },
  { key: 'platform', label: 'Platform' },
  { key: 'format', label: 'Format' },
  { key: 'audience', label: 'Audience' },
  { key: 'funnel', label: 'Funnel Stage' },
  { key: 'pillar', label: 'Pillar / Campaign' },
  { key: 'topic', label: 'Topic' },
  { key: 'hook', label: 'Hook' },
  { key: 'breakdown', label: 'Slide/Reel Breakdown' },
  { key: 'visualDirection', label: 'Visual Direction' },
  { key: 'cta', label: 'CTA' },
  { key: 'status', label: 'Status' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'date', label: 'Date' },
  { key: 'notes', label: 'Notes' },
  { key: 'references', label: 'References' },
];

function escapeCsvCell(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

function referencesToText(refs) {
  return (refs || []).map((r) => `${r.label}: ${r.url}`).join('; ');
}

// clientItemPairs: [[client, items[]], ...]. statusFor: (client, num) => status string.
export function itemsToCSV(clientItemPairs, statusFor, includeClientColumn) {
  const headerCols = includeClientColumn
    ? ['Client', ...EXPORT_COLUMNS.map((c) => c.label)]
    : EXPORT_COLUMNS.map((c) => c.label);
  const lines = [headerCols.map(escapeCsvCell).join(',')];

  clientItemPairs.forEach(([client, items]) => {
    items.forEach((item) => {
      const row = EXPORT_COLUMNS.map((col) => {
        if (col.key === 'status') return statusFor(client, item.num);
        if (col.key === 'references') return referencesToText(item.references);
        return item[col.key];
      });
      lines.push((includeClientColumn ? [client, ...row] : row).map(escapeCsvCell).join(','));
    });
  });

  return lines.join('\r\n');
}

export function downloadCSV(filename, csvText) {
  // Leading BOM so Excel opens UTF-8 (em dashes, arrows, curly quotes) correctly
  // instead of mangling it into Latin-1.
  const blob = new Blob(['﻿' + csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
