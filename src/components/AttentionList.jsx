import { useNavigate } from 'react-router-dom';
import { ATTENTION_NOTES, WEEK_RANGES } from '../data/campaign.js';
import { fmtHours, slug, weekMinutes } from '../lib/derived.js';

function AttentionItem({ type, typeLabel, children, onOpen }) {
  return (
    <div className={`attn-card attn-${type}`}>
      <div className="attn-icon">!</div>
      <div className="attn-body">
        <div className="attn-type">{typeLabel}</div>
        <div className="attn-message">{children}</div>
      </div>
      <button className="attn-cta" onClick={onOpen}>Open →</button>
    </div>
  );
}

export default function AttentionList({ weeklyData }) {
  const navigate = useNavigate();
  const items = [];

  ATTENTION_NOTES.forEach((note, i) => {
    items.push(
      <AttentionItem
        key={`note-${i}`}
        type="shortage"
        typeLabel="Shortage"
        onOpen={() => navigate(`/clients/${slug(note.client)}`)}
      >
        <span dangerouslySetInnerHTML={{ __html: note.text }} />
      </AttentionItem>
    );
  });

  [1, 2, 3, 4].forEach((w) => {
    if (weekMinutes(w, weeklyData) / 60 > 32) {
      items.push(
        <AttentionItem
          key={`week-${w}`}
          type="workload"
          typeLabel="Workload"
          onOpen={() => navigate('/weekly', { state: { openWeek: w } })}
        >
          {WEEK_RANGES[w].label} runs <b>~{fmtHours(weekMinutes(w, weeklyData))}</b> of production — plan the extra time
        </AttentionItem>
      );
    }
  });

  if (!items.length) {
    return <div className="attn-empty">Nothing needs attention right now.</div>;
  }

  return <div className="attn-list">{items}</div>;
}
