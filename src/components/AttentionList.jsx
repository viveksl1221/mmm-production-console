import { useNavigate } from 'react-router-dom';
import { ATTENTION_NOTES, WEEK_RANGES } from '../data/campaign.js';
import { fmtHours, slug, weekMinutes } from '../lib/derived.js';

export default function AttentionList() {
  const navigate = useNavigate();
  const rows = [];

  ATTENTION_NOTES.forEach((note, i) => {
    rows.push(
      <div className="attn-row" key={`note-${i}`}>
        <div className="t" dangerouslySetInnerHTML={{ __html: note.text }} />
        <div className="go" onClick={() => navigate(`/clients/${slug(note.client)}`)}>Open →</div>
      </div>
    );
  });

  [1, 2, 3, 4].forEach((w) => {
    if (weekMinutes(w) / 60 > 32) {
      rows.push(
        <div className="attn-row" key={`week-${w}`}>
          <div className="t">
            {WEEK_RANGES[w].label} runs <b>~{fmtHours(weekMinutes(w))}</b> of production — plan the extra time
          </div>
          <div className="go" onClick={() => navigate('/weekly', { state: { openWeek: w } })}>Open →</div>
        </div>
      );
    }
  });

  return <div id="attn-list">{rows}</div>;
}
