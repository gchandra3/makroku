import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Database } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Sparkline } from "@/components/charts";
import { dataSources, indicators } from "@/lib/macro-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Insights & Data Sources | MacroCast" },
      {
        name: "description",
        content:
          "Plain-English research notes on Indonesian growth and inflation, with methodology details and full data provenance from World Bank, FRED and HK C&SD.",
      },
      { property: "og:title", content: "Research Insights & Data Sources | MacroCast" },
      {
        property: "og:description",
        content:
          "What the models tell us about the next four quarters — plus where every number comes from.",
      },
    ],
  }),
  component: Research,
});

const methodology = [
  {
    title: "How the models were fitted",
    body: "Each series was split 80/20 into training and hold-out samples. ARIMA and SARIMA orders were selected by AICc over a grid search; the regression uses CPI inflation, the BI policy rate and export volume, all lagged one quarter to avoid look-ahead bias.",
  },
  {
    title: "How accuracy was scored",
    body: "Errors are computed on rolling one-step-ahead forecasts across the hold-out window. MAE and RMSE are in percentage points; accuracy is the share of quarters where the forecast got the direction of change right.",
  },
  {
    title: "Known limitations",
    body: "The 2020 pandemic quarters are structural breaks and are down-weighted rather than removed. Confidence intervals assume normally distributed errors, which understates tail risk during commodity or currency shocks.",
  },
];

function Research() {
  const gdp = indicators[0]!;
  const cpi = indicators[1]!;

  return (
    <AppShell>
      <PageHeader title="Research insights" subtitle="What the models are telling us" />

      <section className="px-5">
        <article className="surface-card gradient-green-soft p-5">
          <h2 className="text-base font-extrabold">What does the model tell us?</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            GDP growth is expected to remain relatively stable over the next four quarters. The
            regression model performs better than ARIMA because additional economic indicators
            provide useful predictive information.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Highlight value="5.2%" label="4Q GDP forecast" />
            <Highlight value="2.7%" label="CPI forecast" />
            <Highlight value="86%" label="Model accuracy" />
          </div>
        </article>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 px-5">
        <MiniChart title="GDP growth" value="5.1%" ind={gdp} />
        <MiniChart title="CPI inflation" value="2.8%" ind={cpi} negative />
      </section>

      <section className="mt-5 px-5">
        <article className="surface-card p-5">
          <h2 className="text-sm font-bold">Reading the result</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Inflation has settled near the mid-point of Bank Indonesia&apos;s target band, which
            gives the central bank room to keep easing. That is the main reason the regression
            expects growth to hold above{" "}
            <strong className="text-foreground">5%</strong> rather than drift down.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            The risk is one-sided: a renewed commodity price shock would push inflation up and
            stall the rate-cut path, taking roughly{" "}
            <strong className="text-foreground">0.4pp</strong> off the 2027 growth forecast.
          </p>
        </article>
      </section>

      <section className="mt-5 px-5">
        <h2 className="text-base font-bold">Methodology</h2>
        <div className="mt-3 space-y-2">
          {methodology.map((m) => (
            <Expandable key={m.title} title={m.title} body={m.body} />
          ))}
        </div>
      </section>

      <section className="mt-6 px-5">
        <h2 className="text-base font-bold">Data sources</h2>
        <div className="mt-3 space-y-3">
          {dataSources.map((s) => (
            <article key={s.name} className="surface-card p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft">
                  <Database className="h-4 w-4 text-accent-foreground" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground">{s.detail}</p>
                </div>
              </div>
              <dl className="mt-3 space-y-1.5 text-[12px]">
                <Row k="Frequency" v={s.frequency} />
                <Row k="Observation period" v={s.period} />
                <Row k="Observations" v={s.observations} />
                <Row k="Last updated" v={s.updated} />
              </dl>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}

function Highlight({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-card px-2 py-3 text-center shadow-[var(--shadow-card)]">
      <p className="text-xl font-extrabold tabular text-primary">{value}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

function MiniChart({
  title,
  value,
  ind,
  negative,
}: {
  title: string;
  value: string;
  ind: (typeof indicators)[number];
  negative?: boolean;
}) {
  return (
    <div className="surface-card p-4">
      <p className="text-[11px] text-muted-foreground">{title}</p>
      <p className="text-xl font-extrabold tabular">{value}</p>
      <div className="mt-2 h-10">
        <Sparkline data={ind.series.slice(-20)} negative={negative} />
      </div>
    </div>
  );
}

function Expandable({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="surface-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="text-[13px] font-semibold">{title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <p className="px-4 pb-4 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      ) : null}
    </div>
  );
}
