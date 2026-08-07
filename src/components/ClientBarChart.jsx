import { weekClientBreakdown } from '../lib/derived.js';

// Per-client bar chart for a single week — same hand-rolled SVG style as
// BurnChart.jsx (which does the same thing per-week across the month),
// just grouped by client instead. Used by the weekly scope of the Reports
// page; weekClientBreakdown already returns exactly the shape needed.
export default function ClientBarChart({ w, itemsByClient, posts }) {
  const rows = weekClientBreakdown(w, itemsByClient, posts);
  const W = 640, H = 180, padL = 36, padB = 34, padT = 12;
  const chartW = W - padL - 16, chartH = H - padT - padB;
  const n = Math.max(rows.length, 1);
  const maxVal = Math.max(...rows.map((r) => r.total + r.blogCount), 1) * 1.15;
  const gap = chartW / n, barW = Math.min(gap * 0.5, 46);

  const axisLines = [0, 1, 2, 3].map((i) => {
    const y = padT + chartH - (chartH * i) / 3;
    return (
      <g key={i}>
        <line x1={padL} y1={y} x2={W - 16} y2={y} stroke="#EFEFEF" strokeWidth="1" />
        <text x={padL - 8} y={y + 3} fontSize="9" fill="#8A8A8A" textAnchor="end" fontFamily="Inter, sans-serif">
          {Math.round((maxVal * i) / 3)}
        </text>
      </g>
    );
  });

  const bars = rows.map((r, i) => {
    const total = r.total + r.blogCount;
    const x = padL + gap * i + (gap - barW) / 2;
    const barH = (total / maxVal) * chartH;
    const doneH = (r.done / maxVal) * chartH;
    const y = padT + chartH - barH;
    const doneY = padT + chartH - doneH;
    const label = r.client.length > 13 ? r.client.slice(0, 12) + '…' : r.client;
    return (
      <g key={r.client}>
        <rect x={x} y={y} width={barW} height={barH} rx="5" fill="none" stroke="#D8D8D8" strokeWidth="1.5" />
        <rect x={x} y={doneY} width={barW} height={doneH} rx="5" fill="#FF4A4A" />
        <text x={x + barW / 2} y={padT + chartH + 16} fontSize="9" fill="#5A5A5A" textAnchor="middle" fontFamily="General Sans, Inter, sans-serif">
          {label}
        </text>
        <text x={x + barW / 2} y={y - 8} fontSize="10" fill="#171717" textAnchor="middle" fontFamily="Inter, sans-serif">
          {total}
        </text>
      </g>
    );
  });

  if (!rows.length) {
    return <div className="empty-state">No posts scheduled for this week yet.</div>;
  }

  return (
    <div className="chart-block">
      <div className="section-label">Posts due by client — bar height = due, filled = shipped</div>
      <svg viewBox="0 0 640 180" style={{ width: '100%', height: 180 }}>
        {axisLines}
        {bars}
      </svg>
    </div>
  );
}
