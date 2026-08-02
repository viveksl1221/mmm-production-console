import { WEEK_RANGES } from '../data/campaign.js';
import { fmtHours, getTodayInfo, weekDone, weekMinutes, weekTarget } from '../lib/derived.js';

export default function BurnChart({ posts }) {
  const W = 640, H = 180, padL = 36, padB = 34, padT = 12;
  const chartW = W - padL - 16, chartH = H - padT - padB;
  const maxTarget = Math.max(...[1, 2, 3, 4].map((w) => weekTarget(w))) * 1.15;
  const gap = chartW / 4, barW = gap * 0.5;
  const { weekNum: current } = getTodayInfo();
  const cur = current || 1;

  const axisLines = [0, 1, 2, 3].map((i) => {
    const y = padT + chartH - (chartH * i) / 3;
    return (
      <g key={i}>
        <line x1={padL} y1={y} x2={W - 16} y2={y} stroke="#EFEFEF" strokeWidth="1" />
        <text x={padL - 8} y={y + 3} fontSize="9" fill="#8A8A8A" textAnchor="end" fontFamily="Inter, sans-serif">
          {Math.round((maxTarget * i) / 3)}
        </text>
      </g>
    );
  });

  const bars = [1, 2, 3, 4].map((w) => {
    const target = weekTarget(w);
    const done = weekDone(w, posts);
    const x = padL + gap * (w - 1) + (gap - barW) / 2;
    const barH = (target / maxTarget) * chartH;
    const doneH = (done / maxTarget) * chartH;
    const y = padT + chartH - barH;
    const doneY = padT + chartH - doneH;
    const isCurrent = w === cur;
    return (
      <g key={w}>
        <rect x={x} y={y} width={barW} height={barH} rx="5" fill="none" stroke={isCurrent ? '#FF4A4A' : '#D8D8D8'} strokeWidth="1.5" />
        <rect x={x} y={doneY} width={barW} height={doneH} rx="5" fill="#FF4A4A" />
        <text
          x={x + barW / 2}
          y={padT + chartH + 16}
          fontSize="10"
          fill={isCurrent ? '#FF4A4A' : '#5A5A5A'}
          textAnchor="middle"
          fontFamily="General Sans, Inter, sans-serif"
          fontWeight={isCurrent ? '600' : '400'}
        >
          {WEEK_RANGES[w].label}
        </text>
        <text x={x + barW / 2} y={y - 8} fontSize="10" fill="#171717" textAnchor="middle" fontFamily="Inter, sans-serif">
          {target}
        </text>
        <text x={x + barW / 2} y={padT + chartH + 28} fontSize="8.5" fill="#C93636" textAnchor="middle" fontFamily="Inter, sans-serif">
          ~{fmtHours(weekMinutes(w))}
        </text>
      </g>
    );
  });

  return (
    <div className="chart-block">
      <div className="section-label">Weekly load — bar height = due, filled = shipped</div>
      <svg viewBox="0 0 640 180" style={{ width: '100%', height: 180 }}>
        {axisLines}
        {bars}
      </svg>
    </div>
  );
}
