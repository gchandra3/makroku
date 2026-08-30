import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ForecastChart } from "@/components/charts";
import { buildForecast, indicators, models, type ModelKey } from "@/lib/macro-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/forecast")({
  head: () => ({
    meta: [
      { title: "Create a Forecast | MacroCast" },
      {
        name: "description",
        content:
          "Pick an indicator, a model (Naive, ARIMA, SARIMA or Regression) and a horizon to generate a forecast with confidence intervals.",
      },
      { property: "og:title", content: "Create a Forecast | MacroCast" },
      {
        property: "og:description",
        content:
          "Three taps to a quarterly macro forecast with historical series, forecast line and confidence bands.",
      },
    ],
  }),
  component: Forecast,
});

const horizons = [1, 2, 4, 8];

function Forecast() {
  const [indicatorId, setIndicatorId] = useState(indicators[0]!.id);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [model, setModel] = useState<ModelKey>("regression");
  const [horizon, setHorizon] = useState(4);
  const [result, setResult] = useState<null | { point: number; horizon: number }>(null);

  const indicator = indicators.find((i) => i.id === indicatorId)!;
  const chosen = models.find((m) => m.key === model)!;

  return (
    <AppShell>
      <PageHeader title="Create a forecast" subtitle="Three steps, one tap to run" />

      <section className="px-5">
        <StepLabel n={1} title="Choose indicator" />
        <button
          onClick={() => setPickerOpen((o) => !o)}
          className="surface-card mt-2 flex w-full items-center justify-between px-4 py-4 text-left"
        >
          <span>
            <span className="block text-sm font-bold">{indicator.name}</span>
            <span className="block text-[12px] text-muted-foreground">
              {indicator.frequency} · {indicator.source}
            </span>
          </span>
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform", pickerOpen && "rotate-180")}
          />
        </button>
        {pickerOpen ? (
          <div className="surface-card mt-2 divide-y divide-border overflow-hidden">
            {indicators.map((i) => (
              <button
                key={i.id}
                onClick={() => {
                  setIndicatorId(i.id);
                  setPickerOpen(false);
                  setResult(null);
                }}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px]"
              >
                <span className="font-medium">{i.name}</span>
                {i.id === indicatorId ? <Check className="h-4 w-4 text-primary" /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-6 px-5">
        <StepLabel n={2} title="Choose model" />
        <div className="mt-2 space-y-3">
          {models.map((m) => (
            <button
              key={m.key}
              onClick={() => {
                setModel(m.key);
                setResult(null);
              }}
              className={cn(
                "surface-card flex w-full items-start gap-3 p-4 text-left transition-colors",
                model === m.key && "border-primary bg-primary-soft",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  model === m.key ? "border-primary bg-primary" : "border-border",
                )}
              >
                {model === m.key ? (
                  <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                ) : null}
              </span>
              <span>
                <span className="block text-sm font-bold">{m.name}</span>
                <span className="block text-[12px] leading-relaxed text-muted-foreground">
                  {m.blurb}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 px-5">
        <StepLabel n={3} title="Forecast horizon" />
        <div className="mt-2 grid grid-cols-4 gap-2">
          {horizons.map((h) => (
            <button
              key={h}
              onClick={() => {
                setHorizon(h);
                setResult(null);
              }}
              className={cn(
                "rounded-2xl border py-3 text-[13px] font-semibold transition-colors",
                horizon === h
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {h}Q
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">
          {horizon} quarter{horizon > 1 ? "s" : ""} ahead
        </p>
      </section>

      <section className="mt-6 px-5">
        <button
          onClick={() => setResult({ point: chosen.point, horizon })}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-[var(--shadow-green)] active:scale-[0.99]"
        >
          <Sparkles className="h-4 w-4" /> Generate Forecast
        </button>
      </section>

      {result ? <Result indicator={indicator} model={chosen} result={result} /> : null}
    </AppShell>
  );
}

function Result({
  indicator,
  model,
  result,
}: {
  indicator: (typeof indicators)[number];
  model: (typeof models)[number];
  result: { point: number; horizon: number };
}) {
  const { rows, divider } = buildForecast(indicator, result.point, result.horizon);
  const lastRow = rows[rows.length - 1]!;

  return (
    <section className="mt-7 px-5">
      <h2 className="text-base font-bold">Your forecast</h2>
      <div className="surface-card mt-3 gradient-green-soft p-5">
        <p className="text-[52px] font-extrabold leading-none tabular">
          {result.point.toFixed(1)}
          {indicator.unit}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Expected next-quarter outcome for {indicator.name}
        </p>
        <p className="mt-1 text-[12px] font-semibold text-accent-foreground">
          {model.name} · 90% interval {lastRow.lower}
          {indicator.unit} – {lastRow.upper}
          {indicator.unit} at {result.horizon}Q
        </p>
      </div>

      <div className="surface-card mt-3 px-2 py-4">
        <ForecastChart rows={rows} divider={divider} />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[11px] text-muted-foreground">
        <Legend color="var(--color-chart-5)" label="Historical" />
        <Legend color="var(--color-primary)" label="Forecast" />
        <Legend color="var(--color-primary)" label="90% confidence interval" faded />
      </div>
    </section>
  );
}

function Legend({
  color,
  label,
  faded,
}: {
  color: string;
  label: string;
  faded?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2 w-4 rounded-full"
        style={{ background: color, opacity: faded ? 0.25 : 1 }}
      />
      {label}
    </span>
  );
}

function StepLabel({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-accent-foreground">
        {n}
      </span>
      <p className="text-sm font-bold">{title}</p>
    </div>
  );
}
