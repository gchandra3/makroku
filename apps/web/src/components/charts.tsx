import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState, type ReactNode } from "react";
import type { Point } from "@/lib/econ-data";
import type { Coefficient } from "@/lib/stats";
import { cn } from "@/lib/utils";

/** Recharts measures its container on first paint; mount one frame later. */
function AfterPaint({ height, children }: { height: number; children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (!ready) return <div style={{ height }} />;
  return <>{children}</>;
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
      borderRadius: 12,
      border: "1px solid var(--color-border)",
      background: "var(--color-card)",
      color: "var(--color-card-foreground)",
      fontSize: 12,
      boxShadow: "var(--shadow-card)",
    },
    labelStyle: { color: "var(--color-muted-foreground)", fontSize: 11 },
  };
}

export function Sparkline({
  data,
  negative = false,
  height = 40,
}: {
  data: Point[];
  negative?: boolean;
  height?: number;
}) {
  const id = `sp-${Math.abs(data.reduce((a, p, i) => a + p.value * (i + 1), 0) * 100).toFixed(0)}`;
  const stroke = negative ? "var(--color-negative)" : "var(--color-primary)";
  return (
    <AfterPaint height={height}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            baseValue="dataMin"
            stroke={stroke}
            strokeWidth={2}
            fill={`url(#${id})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </AfterPaint>
  );
}

export function SeriesChart({ data, unit, height = 240 }: { data: Point[]; unit: string; height?: number }) {
  return (
    <AfterPaint height={height}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 14, bottom: 0, left: -14 }}>
          <defs>
            <linearGradient id="series-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="period" minTickGap={30} {...axis} />
          <YAxis width={46} domain={["auto", "auto"]} tickCount={5} tickFormatter={(v) => Number(v).toFixed(1)} {...axis} />
          <Tooltip formatter={(v) => [`${Number(v).toFixed(2)} ${unit}`, "Value"]} {...tooltipStyle()} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-primary)"
            strokeWidth={2.4}
            fill="url(#series-fill)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </AfterPaint>
  );
}

export function ActualPredictedChart({
  periods,
  actual,
  fitted,
  unit,
  showActual = true,
  showPredicted = true,
}: {
  periods: string[];
  actual: number[];
  fitted: number[];
  unit: string;
  showActual?: boolean;
  showPredicted?: boolean;
}) {
  const rows = periods.map((period, i) => ({ period, actual: actual[i], predicted: fitted[i] }));
  return (
    <AfterPaint height={280}>
      <figure aria-label={`Actual versus model-predicted values from ${periods[0]} to ${periods[periods.length - 1]}`}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={rows} margin={{ top: 8, right: 14, bottom: 0, left: -14 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="period" minTickGap={40} {...axis} />
            <YAxis width={46} domain={["auto", "auto"]} tickCount={5} tickFormatter={(v) => Number(v).toFixed(1)} {...axis} />
            <Tooltip formatter={(v: number | string, n) => [`${Number(v).toFixed(2)} ${unit}`, String(n)]} {...tooltipStyle()} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {showActual ? (
              <Line type="monotone" dataKey="actual" name="Actual" stroke="var(--color-chart-5)" strokeWidth={2.2} dot={false} isAnimationActive={false} />
            ) : null}
            {showPredicted ? (
              <Line
                type="monotone"
                dataKey="predicted"
                name="Predicted"
                stroke="var(--color-primary)"
                strokeWidth={2.4}
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive={false}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </figure>
    </AfterPaint>
  );
}

/** Horizontal coefficient plot — bars diverge from a zero line, with sign glyphs. */
export function CoefficientChart({ coefficients }: { coefficients: Coefficient[] }) {
  const max = Math.max(...coefficients.map((c) => Math.abs(c.coefficient)), 0.001);
  return (
    <div>
      <div className="mb-2 flex justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Negative</span>
        <span>Positive</span>
      </div>
      <ul className="space-y-3">
        {coefficients.map((c) => {
          const pct = (Math.abs(c.coefficient) / max) * 48;
          const positive = c.coefficient >= 0;
          return (
            <li key={c.variable}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[13px] font-semibold">{c.label}</span>
                <span
                  className={cn(
                    "tabular text-[13px] font-bold",
                    !c.significant ? "text-muted-foreground" : positive ? "text-primary" : "text-negative",
                  )}
                >
                  {positive ? "+" : "−"}
                  {Math.abs(c.coefficient).toFixed(3)} {positive ? "↑" : "↓"}
                </span>
              </div>
              <div className="relative mt-1.5 h-3 rounded-full bg-muted">
                <span className="absolute inset-y-0 left-1/2 w-px bg-border" />
                <span
                  className={cn(
                    "absolute inset-y-0 rounded-full",
                    !c.significant ? "bg-muted-foreground/40" : positive ? "bg-primary" : "bg-negative",
                  )}
                  style={positive ? { left: "50%", width: `${pct}%` } : { right: "50%", width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
