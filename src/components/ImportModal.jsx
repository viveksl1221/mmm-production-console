import { useMemo, useState } from 'react';
import { ALL_CLIENTS } from '../data/campaign.js';
import {
  FIELD_OPTIONS, diffItems, guessClientForSheet, guessFieldForHeader, parseWorkbookFile,
  reconcileNumbersByTopic, rowsToItems,
} from '../lib/importParser.js';

const SKIP_VALUE = '__skip__';

function SheetMapping({ sheet, onChangeClient, onChangeColumn }) {
  return (
    <div className="import-sheet-card">
      <div className="import-sheet-head">
        <div className="import-sheet-name">{sheet.sheetName}</div>
        <select
          className="edit-select import-client-select"
          value={sheet.client || SKIP_VALUE}
          onChange={(e) => onChangeClient(e.target.value === SKIP_VALUE ? null : e.target.value)}
        >
          <option value={SKIP_VALUE}>Skip this sheet</option>
          {ALL_CLIENTS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {sheet.client && (
        <div className="import-columns">
          {sheet.headerRow.map((header, colIdx) => (
            <div className="import-column-row" key={colIdx}>
              <div className="import-column-header">{header || `Column ${colIdx + 1}`}</div>
              <select
                className="edit-select"
                value={sheet.columnMapping[colIdx]}
                onChange={(e) => onChangeColumn(colIdx, e.target.value)}
              >
                {FIELD_OPTIONS.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiffSummary({ client, diff }) {
  return (
    <div className="import-diff-card">
      <div className="import-diff-head">
        <span className="import-diff-client">{client}</span>
        <span className="import-diff-counts">
          {diff.added.length > 0 && <span className="diff-added">+{diff.added.length} new</span>}
          {diff.changed.length > 0 && <span className="diff-changed">{diff.changed.length} updated</span>}
          {diff.unchanged.length > 0 && <span className="diff-unchanged">{diff.unchanged.length} unchanged</span>}
        </span>
      </div>
      {diff.changed.length > 0 && (
        <ul className="import-diff-list">
          {diff.changed.map(({ item, fieldsChanged }) => (
            <li key={item.num}>#{item.num} {item.topic || '(untitled)'} — {fieldsChanged.join(', ')}</li>
          ))}
        </ul>
      )}
      {diff.added.length > 0 && (
        <ul className="import-diff-list">
          {diff.added.map((item) => (
            <li key={item.num}>#{item.num} {item.topic || '(untitled)'} <span className="diff-added">new</span></li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ImportModal({ content, setPostStatus, onClose }) {
  const [step, setStep] = useState('upload');
  const [error, setError] = useState('');
  const [sheets, setSheets] = useState([]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const parsed = await parseWorkbookFile(file);
      const withMapping = parsed.map((sheet) => {
        const client = guessClientForSheet(sheet.sheetName, ALL_CLIENTS);
        const columnMapping = sheet.headerRow.map((h) => guessFieldForHeader(h));
        return { ...sheet, client, columnMapping };
      });
      setSheets(withMapping);
      setStep('map');
    } catch (err) {
      setError('Could not read that file — make sure it\'s a valid .xlsx or .csv export.');
    }
  }

  function updateSheetClient(sheetName, client) {
    setSheets((prev) => prev.map((s) => (s.sheetName === sheetName ? { ...s, client } : s)));
  }
  function updateSheetColumn(sheetName, colIdx, field) {
    setSheets((prev) => prev.map((s) => {
      if (s.sheetName !== sheetName) return s;
      const columnMapping = [...s.columnMapping];
      columnMapping[colIdx] = field;
      return { ...s, columnMapping };
    }));
  }

  const activeSheets = sheets.filter((s) => s.client);

  const preview = useMemo(() => {
    if (step !== 'preview') return [];
    return activeSheets.map((sheet) => {
      let rawItems = rowsToItems(sheet.headerRow, sheet.dataRows, sheet.columnMapping);
      const existing = content.getItems(sheet.client);
      if (!sheet.columnMapping.includes('num')) {
        rawItems = reconcileNumbersByTopic(rawItems, existing);
      }
      // Status is tracked separately from content (see campaign.js) — pull
      // it out into its own map instead of diffing/storing it on the item.
      const statusByNum = new Map();
      const items = rawItems.map(({ _status, ...item }) => {
        if (_status) statusByNum.set(item.num, _status);
        return item;
      });
      const diff = diffItems(existing, items);
      return { client: sheet.client, items, statusByNum, diff };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function applyImport() {
    preview.forEach(({ client, items, statusByNum }) => {
      content.importItems(client, items);
      statusByNum.forEach((status, num) => setPostStatus(client, num, status));
    });
    setStep('done');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Import content calendar</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {step === 'upload' && (
          <div className="modal-body">
            <p className="import-help">
              Upload an .xlsx or .csv export of your content calendar. Each sheet tab is matched to a client by
              name — you'll confirm the mapping and column meanings next, before anything is applied.
            </p>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
            {error && <div className="import-error">{error}</div>}
          </div>
        )}

        {step === 'map' && (
          <div className="modal-body">
            <p className="import-help">Confirm which client each sheet belongs to, and what each column means.</p>
            {sheets.map((sheet) => (
              <SheetMapping
                key={sheet.sheetName}
                sheet={sheet}
                onChangeClient={(client) => updateSheetClient(sheet.sheetName, client)}
                onChangeColumn={(colIdx, field) => updateSheetColumn(sheet.sheetName, colIdx, field)}
              />
            ))}
            <div className="modal-actions">
              <button className="add-post-btn" onClick={() => setStep('upload')}>Back</button>
              <button
                className="add-post-btn primary"
                disabled={activeSheets.length === 0}
                onClick={() => setStep('preview')}
              >
                Preview changes
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="modal-body">
            <p className="import-help">
              Nothing is applied yet. Rows are matched by Post # — existing posts get updated, new Post #s get
              added. Rows missing from the file are left alone, not deleted.
            </p>
            {preview.map(({ client, diff }) => (
              <DiffSummary key={client} client={client} diff={diff} />
            ))}
            <div className="modal-actions">
              <button className="add-post-btn" onClick={() => setStep('map')}>Back</button>
              <button className="add-post-btn primary" onClick={applyImport}>Apply import</button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="modal-body">
            <p className="import-help">Import applied to this session.</p>
            <div className="modal-actions">
              <button className="add-post-btn primary" onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
