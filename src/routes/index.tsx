import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Compass,
  GitCompareArrows,
  LineChart,
  Settings2,
  BookOpen,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Sparkline } from "@/components/charts";
import { ChangePill } from "@/components/indicator-card";
import { indicators, popularIds } from "@/lib/macro-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MacroCast — Macroeconomic Forecasts Made Simple" },
      {
        name: "description",
        content:
          "Track GDP growth, inflation, unemployment and interest rates, then generate forecasts with ARIMA, SARIMA and regression models.",
      },
      { property: "og:title", content: "MacroCast — Macroeconomic Forecasts Made Simple" },
      {
        property: "og:description",
        content:
          "Explore economic indicators for Indonesia, Hong Kong, Singapore and beyond, and forecast the next quarters in a few taps.",
      },
    ],
  }),
  component: Home,
});

const quickActions = [
  { label: "Explore Data", icon: Compass, to: "/indicators" as const },
  { label: "Forecast", icon: LineChart, to: "/forecast" as const },
  { label: "Compare", icon: GitCompareArrows, to: "/models" as const },
  { label: "Research", icon: BookOpen, to: "/research" as const },
];

function Home() {
  const headline = indicators[0]!;
  const quick = popularIds.map((id) => indicators.find((i) => i.id === id)!);

  return (
    <AppShell>
      <header className="flex items-center justify-between gap-4 px-5 pb-5 pt-7">
        <div>
          <p className="text-sm text-muted-foreground">Good afternoon 👋</p>
          <h1 className="text-[26px] font-extrabold tracking-tight">MacroCast</h1>
        </div>
        <Link
          to="/profile"
          aria-label="Profile and settings"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card shadow-[var(--shadow-card)]"
        >
          <Settings2 className="h-5 w-5 text-muted-foreground" strokeWidth={1.8} />
        </Link>
      </header>

      <section className="px-5">
        <Link
          to="/indicators/$indicatorId"
          params={{ indicatorId: headline.id }}
          className="gradient-green block rounded-3xl p-5 text-primary-foreground shadow-[var(--shadow-green)] transition-transform active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium opacity-90">{headline.name}</p>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
              Quarterly
            </span>
          </div>
          <p className="mt-3 text-[52px] font-extrabold leading-none tabular">5.1%</p>
          <p className="mt-2 text-sm opacity-90">Next quarter forecast</p>
          <p className="mt-1 text-[13px] font-semibold opacity-95">
            +0.3% vs previous forecast
          </p>

          <div className="-mx-1 mt-3 h-14">
            <Sparkline data={headline.series.slice(-24)} height={56} onColor />
          </div>

          <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold">
            View forecast <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </section>

      <section className="mt-7">
        <div className="flex items-center justify-between px-5">
          <h2 className="text-base font-bold">Quick indicators</h2>
          <Link to="/indicators" className="text-[13px] font-semibold text-primary">
            See all
          </Link>
        </div>
        <div className="no-scrollbar mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
          {quick.map((ind) => (
            <Link
              key={ind.id}
              to="/indicators/$indicatorId"
              params={{ indicatorId: ind.id }}
              className="surface-card w-[152px] shrink-0 snap-start p-4"
            >
              <p className="line-clamp-2 h-8 text-[12px] font-medium text-muted-foreground">
                {ind.name}
              </p>
              <p className="mt-2 text-2xl font-extrabold tabular">
                {ind.value}
                {ind.unit}
              </p>
              <div className="mt-1.5">
                <ChangePill change={ind.change} />
              </div>
              <div className="mt-2 h-9">
                <Sparkline data={ind.series.slice(-18)} negative={ind.change < 0} height={36} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-5 px-5">
        <h2 className="text-base font-bold">Quick actions</h2>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {quickActions.map(({ label, icon: Icon, to }) => (
            <Link key={label} to={to} className="flex flex-col items-center gap-2">
              <span className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary-soft">
                <Icon className="h-6 w-6 text-accent-foreground" strokeWidth={1.7} />
              </span>
              <span className="text-center text-[11px] font-semibold leading-tight">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-7 px-5">
        <h2 className="text-base font-bold">Today&apos;s read</h2>
        <Link
          to="/research"
          className="surface-card mt-3 block gradient-green-soft p-4 transition-transform active:scale-[0.99]"
        >
          <p className="text-[13px] font-bold text-accent-foreground">
            Growth stays steady into 2027
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            Regression beats ARIMA on Indonesian GDP (MAE 0.54 vs 0.67) because inflation and
            policy rates add real predictive signal.
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
            Read insight <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </section>
    </AppShell>
  );
}
