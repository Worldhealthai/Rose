// Lightweight, dependency-free SVG charts rendered on the server.

export function BarTrend({
  data,
  height = 160,
  accent = "#37c97e",
  formatValue = (v: number) => String(v),
}: {
  data: { label: string; value: number; highlight?: boolean }[];
  height?: number;
  accent?: string;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const W = 100; // viewBox units; scales to container width
  const gap = n > 1 ? 1.1 : 0;
  const bw = (W - gap * (n - 1)) / Math.max(1, n);
  const top = 6;
  const usable = height - top - 18;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
      >
        <line
          x1={0}
          x2={W}
          y1={height - 18}
          y2={height - 18}
          stroke="#244a37"
          strokeWidth={0.3}
        />
        {data.map((d, i) => {
          const h = Math.max(d.value > 0 ? 1.5 : 0, (d.value / max) * usable);
          const x = i * (bw + gap);
          const y = height - 18 - h;
          return (
            <g key={i}>
              <title>{`${d.label}: ${formatValue(d.value)}`}</title>
              <rect
                x={x}
                y={y}
                width={bw}
                height={h}
                rx={Math.min(1.2, bw / 2)}
                fill={d.highlight ? "#6fe0a3" : accent}
                opacity={d.highlight ? 1 : 0.82}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
        <span>{data[0]?.label}</span>
        {n > 2 && <span>{data[Math.floor(n / 2)]?.label}</span>}
        <span>{data[n - 1]?.label}</span>
      </div>
    </div>
  );
}

export function Donut({
  segments,
  size = 150,
  thickness = 18,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#1c3a2b"
            strokeWidth={thickness}
          />
          {total > 0 &&
            segments.map((s, i) => {
              const len = (s.value / total) * c;
              const el = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += len;
              return el;
            })}
        </g>
        {(centerValue || centerLabel) && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-ink"
          >
            {centerValue && (
              <tspan
                x="50%"
                dy="-0.1em"
                style={{ fontSize: 16, fontWeight: 700 }}
              >
                {centerValue}
              </tspan>
            )}
            {centerLabel && (
              <tspan
                x="50%"
                dy="1.4em"
                style={{ fontSize: 8, fill: "#9fb8aa" }}
              >
                {centerLabel}
              </tspan>
            )}
          </text>
        )}
      </svg>
    </div>
  );
}

/** A thin horizontal stacked bar — good for showing a split on mobile. */
export function StackedBar({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = Math.max(
    1,
    segments.reduce((s, x) => s + x.value, 0),
  );
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-border-soft">
      {segments.map((s, i) => (
        <div
          key={i}
          style={{
            width: `${(s.value / total) * 100}%`,
            background: s.color,
          }}
          title={`${s.label}`}
        />
      ))}
    </div>
  );
}
