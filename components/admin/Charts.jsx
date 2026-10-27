// Server-rendered charts. One series each, one axis, rounded bar ends, native tooltips on every mark.

function niceMax(v) {
  if (v <= 4) return 4;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = [1, 2, 2.5, 5, 10].find((x) => x * p >= v);
  return m * p;
}

export function DailyBars({ series, label = 'Views' }) {
  const W = 1000, H = 260, L = 36, R = 8, T = 10, B = 28;
  const max = niceMax(Math.max(1, ...series.map((s) => s.views)));
  const n = series.length, bw = (W - L - R) / n, gap = Math.min(4, bw * 0.25);
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const ticks = [0, max / 2, max];
  const fmt = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const every = Math.ceil(n / 6);
  return (
    <svg className="a-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} per day, last ${n} days`}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid" x1={L} x2={W - R} y1={y(t)} y2={y(t)} strokeWidth="1" />
          <text x={L - 6} y={y(t) + 4} textAnchor="end">{t}</text>
        </g>
      ))}
      {series.map((s, i) => {
        const x = L + i * bw + gap / 2, w = Math.max(1, bw - gap), top = y(s.views), hgt = H - B - top;
        const r = Math.min(4, w / 2, hgt);
        return (
          <g key={s.day}>
            {s.views > 0 && (
              <path className="bar" d={`M${x},${H - B} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${H - B} Z`}>
                <title>{`${fmt(s.day)}: ${s.views} views, ${s.visitors} visitors`}</title>
              </path>
            )}
            <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent"><title>{`${fmt(s.day)}: ${s.views} views, ${s.visitors} visitors`}</title></rect>
            {i % every === 0 && <text x={x + w / 2} y={H - 8} textAnchor="middle">{fmt(s.day)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export function HBars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="a-hbar">
      {rows.map((r) => (
        <div key={r.label} style={{ display: 'contents' }}>
          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
          <div className="track" title={`${r.label}: ${r.value}`}><div className="fill" style={{ width: `${(r.value / max) * 100}%`, background: r.color || undefined }} /></div>
          <span className="a-num" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}
