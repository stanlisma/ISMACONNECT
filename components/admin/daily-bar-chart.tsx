import type { DailyPoint } from "@/lib/traffic";

interface DailyBarChartProps {
  title: string;
  description: string;
  points: DailyPoint[];
  unit: string;
  color?: string;
}

const WIDTH = 720;
const HEIGHT = 240;
const PADDING = { top: 16, right: 12, bottom: 34, left: 40 };

function niceMax(value: number) {
  if (value <= 4) {
    return 4;
  }

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return step * magnitude;
}

function formatDayLabel(day: string) {
  const [, month, date] = day.split("-");
  const monthName = new Date(`${day}T12:00:00Z`).toLocaleString("en-CA", { month: "short", timeZone: "UTC" });

  return `${monthName} ${Number(date)}`;
}

// Server-rendered, dependency-free bar chart. Each bar carries a <title> so
// hovering (or long-pressing) shows the exact day and count.
export function DailyBarChart({ title, description, points, unit, color = "var(--primary)" }: DailyBarChartProps) {
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const max = niceMax(Math.max(0, ...points.map((point) => point.value)));
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const slot = plotWidth / Math.max(points.length, 1);
  const barWidth = Math.max(2, Math.min(28, slot * 0.7));
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));
  const ticks = [0, max / 2, max];

  return (
    <div className="surface" style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h3 className="section-title" style={{ marginBottom: "0.25rem" }}>
            {title}
          </h3>
          <p className="section-copy" style={{ margin: 0 }}>
            {description}
          </p>
        </div>
        <strong style={{ fontSize: "1.5rem", color: "var(--text)" }}>
          {total.toLocaleString("en-CA")} <span style={{ fontSize: "0.85rem", color: "var(--text-soft)" }}>{unit}</span>
        </strong>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        role="img"
        aria-label={`${title}: ${total} ${unit} over ${points.length} days`}
        style={{ marginTop: "1rem", display: "block", height: "auto" }}
      >
        {ticks.map((tick) => {
          const y = PADDING.top + plotHeight - (tick / max) * plotHeight;

          return (
            <g key={tick}>
              <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} stroke="var(--line)" strokeWidth={1} />
              <text x={PADDING.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="var(--text-soft)">
                {Math.round(tick)}
              </text>
            </g>
          );
        })}

        {points.map((point, index) => {
          const height = (point.value / max) * plotHeight;
          const x = PADDING.left + index * slot + (slot - barWidth) / 2;
          const y = PADDING.top + plotHeight - height;

          return (
            <g key={point.day}>
              <rect x={x} y={point.value > 0 ? y : PADDING.top + plotHeight - 1} width={barWidth} height={Math.max(point.value > 0 ? height : 1, 1)} rx={2} fill={point.value > 0 ? color : "var(--line)"}>
                <title>{`${formatDayLabel(point.day)}: ${point.value} ${unit}`}</title>
              </rect>
              {(points.length - 1 - index) % labelEvery === 0 ? (
                <text x={x + barWidth / 2} y={HEIGHT - 12} textAnchor="middle" fontSize={11} fill="var(--text-soft)">
                  {formatDayLabel(point.day)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
