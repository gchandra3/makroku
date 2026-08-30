import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Point } from "@/lib/macro-data";

export function Sparkline({
  data,
  negative = false,
  height = 40,
  onColor = false,
}: {
  data: Point[];
  negative?: boolean;
  height?: number;
  onColor?: boolean;
}) {
  const id = `spark-${Math.abs(
    data.reduce((a, p, i) => a + p.value * (i + 1), 0) * 1000,
  ).toFixed(0)}`;
  const stroke = onColor
    ? "oklch(1 0 0)"
    : negative
      ? "var(--color-negative)"
      : "var(--color-primary)";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={onColor ? 0.4 : 0.28} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={stroke}
          strokeWidth={2}
          fill={`url(#${id})`}
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const axis = {
  stroke: "var(--color-border)",
  tick: { fill: "var(--color-muted-foreground)", fontSize: 10 },
  tickLine: false,
  axisLine: false,
};

function tooltipStyle() {
  return {
    contentStyle: {
      borderRadius: 14,
      border: "1px solid var(--color-border)",
      background: "var(--color-card)",
      color: "var(--color-card-foreground)",
      fontSize: 12,
      boxShadow: "var(--shadow-card)",
    },
    labelStyle: { color: "var(--color-muted-foreground)", fontSize: 11 },
  };
}

export function TimeSeriesChart({ data, unit }: { data: Point[]; unit: string }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="ts-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="period" minTickGap={28} {...axis} />
        <YAxis width={44} domain={["auto", "auto"]} {...axis} />
        <Tooltip formatter={(v) => [`${v}${unit}`, "Value"]} {...tooltipStyle()} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-primary)"
          strokeWidth={2.4}
          fill="url(#ts-fill)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

type ForecastRow = {
  period: string;
  actual: number | null;
  forecast: number | null;
  band: [number, number] | null;
};

export function ForecastChart({
  rows,
  divider,
}: {
  rows: ForecastRow[];
  divider: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="period" minTickGap={30} {...axis} />
        <YAxis width={44} domain={["auto", "auto"]} {...axis} />
        <Tooltip {...tooltipStyle()} />
        <Area
          type="monotone"
          dataKey="band"
          stroke="none"
          fill="var(--color-primary)"
          fillOpacity={0.14}
          name="90% interval"
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="var(--color-chart-5)"
          strokeWidth={2.2}
          dot={false}
          name="Historical"
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="forecast"
          stroke="var(--color-primary)"
          strokeWidth={2.6}
          strokeDasharray="5 4"
          dot={false}
          name="Forecast"
          connectNulls
        />
        <ReferenceLine
          x={divider}
          stroke="var(--color-muted-foreground)"
          strokeDasharray="3 3"
          label={{
            value: "now",
            position: "top",
            fill: "var(--color-muted-foreground)",
            fontSize: 10,
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
