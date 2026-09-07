import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { TrendingUp } from "lucide-react";
import { AppShell, Page, PageHeader } from "@/components/app-shell";
import { Button, Card, EmptyState, ErrorState, SectionTitle } from "@/components/ui-kit";
import { useCurrentAnalysis } from "@/lib/analysis-store";
import { runPrediction } from "@/lib/analysis.functions";

export const Route = createFileRoute("/predictions")({
  head: () => ({
    meta: [
      { title: "Model Predictions & Scenarios | MacroCast" },
      {
        name: "description",
        content:
          "Enter future values for your explanatory variables and see what your estimated regression model predicts, with an uncertainty range.",
      },
      { property: "og:title", content: "Model Predictions & Scenarios | MacroCast" },
      {
        property: "og:description",
        content: "Scenario sliders and point predictions produced by your own estimated model.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Predictions,
});

function Predictions() {
  const current = useCurrentAnalysis();
  const predictFn = useServerFn(runPrediction);

  const [values, setValues] = useState<Record<string, number>>({});
  const [out, setOut] = useState<{ point: number; lower: number; upper: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scenarioVar, setScenarioVar] = useState<string | null>(null);

  useEffect(() => {
    if (!current) return;
    setValues(Object.fromEntries(current.variables.map((v) => [v.id, v.lastValue])));
    setScenarioVar(current.variables[0]?.id ?? null);
  }, [current]);

  if (!current) {
    return (
      <AppShell>
        <Page>
          <PageHeader title="Predictions" subtitle="Use an estimated model to project your target variable." />
          <EmptyState
            title="No model yet"
            body="Run an analysis first — predictions use the coefficients from your estimated model."
            action={
              <Link to="/analyze">
                <Button>Start an analysis</Button>
              </Link>
            }
          />
        </Page>
      </AppShell>
    );
  }

  async function generate(next = values) {
    if (!current) return;
    setBusy(true);
    setError(null);
    const res = await predictFn({
      data: {
        targetId: current.target.id,
        variableIds: current.variables.map((v) => v.id),
        from: current.from,
        to: current.to,
        significance: current.regression.diagnostics.significance_level,
        values: next,
      },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      setOut(null);
      return;
    }
    setOut({ point: res.point, lower: res.lower, upper: res.upper });
  }

  const scenario = current.variables.find((v) => v.id === scenarioVar);

  return (
    <AppShell>
      <Page>
        <PageHeader
          title={`Predict ${current.target.label.toLowerCase()} — ${current.country}`}
          subtitle={`Based on your model estimated over ${current.quality.period} with ${current.variables.length} variables.`}
        />

        <Card className="mb-4">
          <SectionTitle title="Make a prediction" hint="Enter the values you expect for each variable." />
          <div className="grid gap-3 sm:grid-cols-2">
            {current.variables.map((v) => (
              <label key={v.id} className="block">
                <span className="text-[12px] font-semibold text-muted-foreground">
                  {v.label} ({v.unit})
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={values[v.id] ?? v.lastValue}
                  onChange={(e) => setValues((s) => ({ ...s, [v.id]: Number(e.target.value) }))}
                  className="tabular mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold"
                />
              </label>
            ))}
          </div>
          <div className="mt-4">
            <Button onClick={() => void generate()} disabled={busy}>
              <TrendingUp className="h-4 w-4" /> {busy ? "Calculating…" : "Generate prediction"}
            </Button>
          </div>
        </Card>

        {error ? <ErrorState title="Prediction failed" body={error} /> : null}

        {out ? (
          <Card className="mb-4">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Predicted {current.target.label.toLowerCase()}
            </p>
            <p className="tabular mt-1 text-[44px] font-extrabold leading-none">
              {out.point.toFixed(2)}
              <span className="ml-1.5 text-[14px] font-semibold text-muted-foreground">{current.target.unit}</span>
            </p>
            <p className="tabular mt-2 text-[13px] text-muted-foreground">
              Estimated range {out.lower.toFixed(2)} – {out.upper.toFixed(2)} {current.target.unit}
            </p>
            <p className="mt-2 text-[12px] text-muted-foreground">
              This is a model prediction based on historical associations, not a guaranteed outcome.
            </p>
          </Card>
        ) : null}

        <Card>
          <SectionTitle title="Scenario analysis" hint="Move one variable and re-run the model." />
          <div className="flex flex-wrap gap-2">
            {current.variables.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setScenarioVar(v.id)}
                aria-pressed={v.id === scenarioVar}
                className={
                  v.id === scenarioVar
                    ? "rounded-full bg-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground"
                    : "rounded-full border border-border px-3 py-1.5 text-[12px] font-bold text-muted-foreground"
                }
              >
                {v.label}
              </button>
            ))}
          </div>

          {scenario ? (
            <div className="mt-4">
              <label className="block text-[13px] font-semibold" htmlFor="scenario-slider">
                {scenario.label}:{" "}
                <span className="tabular">
                  {(values[scenario.id] ?? scenario.lastValue).toFixed(2)} {scenario.unit}
                </span>
              </label>
              <input
                id="scenario-slider"
                type="range"
                min={Math.abs(scenario.lastValue) * 0.5}
                max={Math.abs(scenario.lastValue) * 1.5 + 1}
                step={Math.max(Math.abs(scenario.lastValue) / 100, 0.01)}
                value={values[scenario.id] ?? scenario.lastValue}
                onChange={(e) => setValues((s) => ({ ...s, [scenario.id]: Number(e.target.value) }))}
                onMouseUp={() => void generate()}
                onTouchEnd={() => void generate()}
                className="mt-2 w-full accent-[var(--color-primary)]"
              />
              <p className="mt-1 text-[12px] text-muted-foreground">
                Release the slider to recalculate the prediction.
              </p>
            </div>
          ) : null}
        </Card>
      </Page>
    </AppShell>
  );
}
