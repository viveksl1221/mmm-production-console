import { useState } from 'react';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function readableTextColor(hex) {
  if (!HEX_RE.test(hex)) return '#171717';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#171717' : '#FFFFFF';
}

function BrandKitDisplay({ kit, onEdit }) {
  const [copied, setCopied] = useState(null);
  const hasContent = kit.colors.length > 0 || kit.fonts.length > 0 || kit.notes.trim();

  function copyHex(hex) {
    navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="brand-kit">
      <div className="brand-kit-toolbar">
        <button className="add-post-btn" onClick={onEdit}>{hasContent ? 'Edit Brand Kit' : '+ Add Brand Kit'}</button>
      </div>

      {!hasContent && (
        <div className="empty-state">No brand kit yet — add colors, fonts, and notes so they're a click away while designing.</div>
      )}

      {kit.colors.length > 0 && (
        <>
          <div className="section-label">Colors</div>
          <div className="brand-swatch-grid">
            {kit.colors.map((c, i) => {
              const validHex = HEX_RE.test(c.hex) ? c.hex : '#F5F5F5';
              return (
                <button
                  key={i}
                  className="brand-swatch"
                  style={{ background: validHex, color: readableTextColor(validHex) }}
                  onClick={() => copyHex(c.hex)}
                  title={`Copy ${c.hex}`}
                >
                  <span className="brand-swatch-label">{copied === c.hex ? 'Copied ✓' : (c.label || 'Color')}</span>
                  <span className="brand-swatch-hex mono">{c.hex}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {kit.fonts.length > 0 && (
        <>
          <div className="section-label">Fonts</div>
          <div className="brand-font-list">
            {kit.fonts.map((f, i) => (
              <div className="brand-font-row" key={i}>
                <span className="brand-font-label">{f.label || 'Font'}</span>
                <span className="brand-font-name">{f.name}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {kit.notes.trim() && (
        <>
          <div className="section-label">Notes</div>
          <div className="brand-notes-view">{kit.notes}</div>
        </>
      )}
    </div>
  );
}

function BrandKitEditor({ kit, onSave, onCancel }) {
  const [draft, setDraft] = useState(kit);

  function addColor() {
    setDraft((d) => ({ ...d, colors: [...d.colors, { label: '', hex: '#FF4A4A' }] }));
  }
  function updateColor(i, patch) {
    setDraft((d) => ({ ...d, colors: d.colors.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) }));
  }
  function removeColor(i) {
    setDraft((d) => ({ ...d, colors: d.colors.filter((_, idx) => idx !== i) }));
  }

  function addFont() {
    setDraft((d) => ({ ...d, fonts: [...d.fonts, { label: '', name: '' }] }));
  }
  function updateFont(i, patch) {
    setDraft((d) => ({ ...d, fonts: d.fonts.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) }));
  }
  function removeFont(i) {
    setDraft((d) => ({ ...d, fonts: d.fonts.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="brand-kit brand-kit-editor">
      <div className="section-label">Colors</div>
      <div className="brand-color-editor">
        {draft.colors.map((c, i) => (
          <div className="brand-color-edit-row" key={i}>
            <input
              type="color"
              className="brand-color-picker"
              value={HEX_RE.test(c.hex) ? c.hex : '#FF4A4A'}
              onChange={(e) => updateColor(i, { hex: e.target.value })}
            />
            <input className="edit-input" placeholder="Label (e.g. Primary)" value={c.label} onChange={(e) => updateColor(i, { label: e.target.value })} />
            <input className="edit-input mono brand-hex-input" placeholder="#FF4A4A" value={c.hex} onChange={(e) => updateColor(i, { hex: e.target.value })} />
            <button className="row-remove" onClick={() => removeColor(i)}>×</button>
          </div>
        ))}
        <button className="add-ref-btn" onClick={addColor}>+ Add color</button>
      </div>

      <div className="section-label">Fonts</div>
      <div className="brand-font-editor">
        {draft.fonts.map((f, i) => (
          <div className="brand-font-edit-row" key={i}>
            <input className="edit-input" placeholder="Label (e.g. Heading)" value={f.label} onChange={(e) => updateFont(i, { label: e.target.value })} />
            <input className="edit-input" placeholder="Font name (e.g. Poppins)" value={f.name} onChange={(e) => updateFont(i, { name: e.target.value })} />
            <button className="row-remove" onClick={() => removeFont(i)}>×</button>
          </div>
        ))}
        <button className="add-ref-btn" onClick={addFont}>+ Add font</button>
      </div>

      <div className="section-label">Notes</div>
      <textarea
        className="edit-textarea brand-notes-edit"
        placeholder="Guideline links, usage notes…"
        value={draft.notes}
        onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
      />

      <div className="row-save-bar brand-kit-save-bar">
        <span className="row-save-label">● Editing Brand Kit</span>
        <div className="row-save-actions">
          <button className="row-discard-btn" onClick={onCancel}>Cancel</button>
          <button className="row-save-btn" onClick={() => onSave(draft)}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function BrandKitSection({ kit, onSave }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <BrandKitEditor
        kit={kit}
        onCancel={() => setEditing(false)}
        onSave={(draft) => {
          onSave(draft);
          setEditing(false);
        }}
      />
    );
  }

  return <BrandKitDisplay kit={kit} onEdit={() => setEditing(true)} />;
}
