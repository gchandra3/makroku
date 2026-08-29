import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, Trophy } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { models } from "@/lib/macro-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/models")({
  head: () => ({
    meta: [
      { title: "Model Comparison — Which Model Wins? | MacroCast" },
      {
        name: "description",
        content:
          "Compare MAE, RMSE and directional accuracy across Naive, ARIMA, SARIMA and regression forecasts of Indonesian GDP growth.",
      },
      { property: "og:title", content: "Model Comparison | MacroCast" },
      {
        property: "og:description",
        content:
          "Side-by-side accuracy scoreboard for macro forecasting models, in plain English.",
      },
    ],
  }),
  component: Models,
});

function Models() {
  const [open, setOpen] = useState(false);
  const ranked = [...models].sort((a, b) => a.mae - b.mae);
  const best = ranked[0]!;

  return (
    <AppShell>
      <PageHeader
        title="Which model performs best?"
        subtitle="Backtested on Indonesia GDP growth, 2015 Q1 – 2026 Q2"
      />

      <section className="space-y-3 px-5">
        {ranked.map((m) => {
          const isBest = m.key === best.key;
          return (
            <article
              key={m.key}
              className={cn("surface-card p-4", isBest && "border-primary bg-primary-soft")}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold">{m.name}</h2>
                {isBest ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                    <Trophy className="h-3 w-3" /> Best model
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">{m.blurb}</p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <Metric label="MAE" value={m.mae.toFixed(2)} />
                <Metric label="RMSE" value={m.rmse.toFixed(2)} />
                <Metric label="Accuracy" value={`${m.accuracy}%`} />
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${m.accuracy}%` }}
                />
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-5 px-5">
        <button
          onClick={() => setOpen((o) => !o)}
          className="surface-card flex w-full items-center justify-between p-4 text-left"
        >
          <span className="text-sm font-bold">Why?</span>
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </button>
        {open ? (
          <div className="surface-card mt-2 space-y-3 p-4 text-[13px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Lower is better</strong> for MAE and RMSE:
              they measure how far the forecast lands from what actually happened, in
              percentage points.
            </p>
            <p>
              Regression wins because Indonesian GDP growth reacts to things outside its own
              history — inflation, the policy rate and export demand. ARIMA and SARIMA only
              see the GDP series itself, so they react after the fact.
            </p>
            <p>
              The Naive model still gets 77% direction right, which is the honest baseline any
              model must beat before it is worth trusting.
            </p>
          </div>
        ) : null}
      </section>

      <section className="mt-5 px-5">
        <Link
          to="/research"
          className="flex w-full items-center justify-center rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-[var(--shadow-green)] active:scale-[0.99]"
        >
          Read the research insight
        </Link>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card/70 px-2.5 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-extrabold tabular">{value}</p>
    </div>
  );
}
