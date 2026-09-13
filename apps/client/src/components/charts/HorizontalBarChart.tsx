export interface BarDatum {
  label: string;
  value: number;
  displayValue: string;
  color: string;
}

// Mark spec per the dataviz skill: bars <=24px thick, 4px rounded data-end,
// square at the baseline (only the end away from the axis is rounded).
const BAR_HEIGHT = 20;
const ROW_GAP = 14;
const RADIUS = 4;
const LABEL_WIDTH = 130;
const CHART_WIDTH = 320;
const END_LABEL_GUTTER = 60;

function roundedEndBarPath(width: number, height: number, radius: number): string {
  const r = Math.min(radius, width, height / 2);
  if (r <= 0) return `M0,0 H${width} V${height} H0 Z`;
  return [
    `M0,0`,
    `H${width - r}`,
    `Q${width},0 ${width},${r}`,
    `V${height - r}`,
    `Q${width},${height} ${width - r},${height}`,
    `H0`,
    `Z`,
  ].join(" ");
}

/**
 * A single-hue-family horizontal bar chart — used for both "compare magnitude"
 * (one consistent hue, e.g. placement % by department) and "ordinal ramp"
 * (a distinct step per bar, e.g. funnel stages) by simply varying `color` per
 * datum. No gridlines/axis: every bar carries a direct end-label, which per
 * the dataviz skill's own rule means axis ticks aren't needed here.
 */
export function HorizontalBarChart({ bars }: { bars: BarDatum[] }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const rowHeight = BAR_HEIGHT + ROW_GAP;
  const height = bars.length * rowHeight;
  const totalWidth = LABEL_WIDTH + CHART_WIDTH + END_LABEL_GUTTER;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${totalWidth} ${height}`}
      role="img"
      aria-label="bar chart"
      className="max-w-full"
    >
      {bars.map((bar, i) => {
        const y = i * rowHeight;
        const barLength = Math.max((bar.value / max) * CHART_WIDTH, 2);
        return (
          <g key={bar.label}>
            <text
              x={LABEL_WIDTH - 8}
              y={y + BAR_HEIGHT / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="12"
              fill="#52514e"
            >
              {bar.label}
            </text>
            <g transform={`translate(${LABEL_WIDTH}, ${y})`}>
              <path d={roundedEndBarPath(barLength, BAR_HEIGHT, RADIUS)} fill={bar.color} />
            </g>
            <text
              x={LABEL_WIDTH + barLength + 8}
              y={y + BAR_HEIGHT / 2}
              dominantBaseline="middle"
              fontSize="12"
              fontWeight="600"
              fill="#0b0b0b"
            >
              {bar.displayValue}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
