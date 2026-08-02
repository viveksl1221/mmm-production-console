const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'weekly', label: 'Weekly Plan' },
  { id: 'clients', label: 'Clients' },
];

export default function TabNav({ active, onChange }) {
  return (
    <div className="tabnav">
      {TABS.map((t) => (
        <button key={t.id} className={`tab-btn ${active === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
