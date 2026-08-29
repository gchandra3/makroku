import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Activity, ArrowLeft, CalendarClock, Gauge, TrendingUp } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TimeSeriesChart } from "@/components/charts";
import { ChangePill } from "@/components/indicator-card";
import { getIndicator } from "@/lib/macro-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/indicators/$indicatorId")({
  loader: ({ params }) => {
    const indicator = getIndicator(params.indicatorId);
    if (!indicator) throw notFound();
    return indicator;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "Indicator";
    const desc = `${name}: latest value, history, volatility and next-period forecast on MacroCast.`;
    return {
      meta: [
        { title: `${name} | MacroCast` },
        { name: "description", content: desc },
        { property: "og:title", content: `${name} | MacroCast` },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: Detail,
});

const ranges = [
  { label: "1Y", n: 4 },
  { label: "3Y", n: 12 },
  { label: "5Y", n: 20 },
  { label: "10Y", n: 40 },
  { label: "Max", n: 999 },
];

function Detail() {
  const ind = Route.useLoaderData();
  const [range, setRange] = useState("5Y");
  const n = ranges.find((r) => r.label === range)!.n;
  const data = ind.series.slice(-n);

  const values = data.map((d) => d.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const vol = Math.sqrt(
    values.reduce((a, b) => a + (b - avg) ** 2, 0) / Math.max(values.length - 1, 1),
  );
  const trend = ind.value - (values[0] ?? ind.value);

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pb-2 pt-7">
        <Link
          to="/indicators"
          aria-label="Back to indicators"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {ind.country} · {ind.category}
          </p>
          <h1 className="truncate text-[19px] font-extrabold tracking-tight">{ind.name}</h1>
        </div>
      </header>

      <section className="px-5 pt-3">
        <div className="surface-card gradient-green-soft p-5">
          <div className="flex items-end gap-3">
            <p className="text-[46px] font-extrabold leading-none tabular">
              {ind.value}
              {ind.unit}
            </p>
            <ChangePill change={ind.change} className="mb-2" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-y-3 text-[13px]">
            <Meta label="Basis" value="Year over year" />
            <Meta label="Previous" value={`${ind.previous}${ind.unit}`} />
            <Meta label="Forecast" value={`${ind.forecast}${ind.unit}`} />
            <Meta label="Last updated" value={ind.updated} />
          </div>
        </div>
      </section>

      <section className="mt-5 px-5">
        <div className="surface-card px-2 py-4">
          <TimeSeriesChart data={data} unit={ind.unit} />
        </div>
        <div className="mt-3 flex gap-2">
          {ranges.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.label)}
              className={cn(
                "flex-1 rounded-xl border py-2 text-[13px] font-semibold transition-colors",
                range === r.label
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 px-5">
        <Stat
          icon={TrendingUp}
          label="Trend"
          value={`${trend >= 0 ? "+" : ""}${trend.toFixed(2)}${ind.unit}`}
          hint={`over the last ${range}`}
        />
        <Stat
          icon={Activity}
          label="Volatility"
          value={`${vol.toFixed(2)}`}
          hint="std. dev. of the window"
        />
        <Stat
          icon={Gauge}
          label="Historical average"
          value={`${avg.toFixed(2)}${ind.unit}`}
          hint={`${data.length} observations`}
        />
        <Stat
          icon={CalendarClock}
          label="Latest change"
          value={`${ind.change >= 0 ? "+" : ""}${ind.change}${ind.unit}`}
          hint={`vs ${ind.previous}${ind.unit} prior`}
        />
      </section>

      <section className="mt-5 px-5">
        <div className="surface-card p-4 text-[13px]">
          <p className="font-bold">Data provenance</p>
          <div className="mt-2 space-y-1.5 text-muted-foreground">
            <Row k="Source" v={ind.source} />
            <Row k="Frequency" v={ind.frequency} />
            <Row k="Observation period" v={ind.period} />
            <Row k="Observations" v={String(ind.observations)} />
            <Row k="Last updated" v={ind.updated} />
          </div>
        </div>
      </section>

      <section className="mt-5 px-5">
        <Link
          to="/forecast"
          className="flex w-full items-center justify-center rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-[var(--shadow-green)] active:scale-[0.99]"
        >
          Forecast this indicator
        </Link>
      </section>
    </AppShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-semibold tabular">{value}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span>{k}</span>
      <span className="text-right font-medium text-foreground">{v}</span>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="surface-card p-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft">
        <Icon className="h-4 w-4 text-accent-foreground" />
      </span>
      <p className="mt-2.5 text-[11px] text-muted-foreground">{label}</p>
      <p className="text-lg font-extrabold tabular">{value}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
