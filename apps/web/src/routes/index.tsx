import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus, Search } from "lucide-react";
import { AppShell, Page } from "@/components/app-shell";
import { Sparkline } from "@/components/charts";
import { Button, Card, Delta, EmptyState, SectionTitle } from "@/components/ui-kit";
import { getIndicator, indicators, latest, formatValue, popularTargets } from "@/lib/econ-data";
import { relativeTime, useSavedAnalyses } from "@/lib/analysis-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MacroCast — Understand What Moves the Economy" },
      {
        name: "description",
        content:
          "Pick an economic target, choose the variables that may influence it, run a regression and read the results in plain language.",
      },
      { property: "og:title", content: "MacroCast — Understand What Moves the Economy" },
      {
        property: "og:description",
        content: "Regression-based economic analysis for Indonesia, Hong Kong and Singapore, explained simply.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const quick = ["indonesia-cpi", "indonesia-gdp", "indonesia-unemployment", "indonesia-fx"];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Home() {
  const { items } = useSavedAnalyses();

  return (
    <AppShell>
      <Page>
        <header className="mb-6">
          <p className="text-sm text-muted-foreground">{greeting()}</p>
          <h1 className="mt-0.5 text-[26px] font-extrabold tracking-tight lg:text-[32px]">
            Explore how economic variables interact
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Choose what you want to explain, add the variables that might influence it, and see which
            relationships hold up statistically.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link to="/analyze">
              <Button>
                <Plus className="h-4 w-4" /> New analysis
              </Button>
            </Link>
            <Link
              to="/data"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:border-primary/40"
            >
              <Search className="h-4 w-4" /> Search an indicator
            </Link>
          </div>
        </header>

        <section className="mb-7">
          <SectionTitle title="Quick analysis" hint="Start with a common target variable." />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {quick.map((id) => {
              const ind = getIndicator(id)!;
              const l = latest(ind);
              return (
                <Link
                  key={id}
                  to="/analyze"
                  search={{ target: id }}
                  className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40"
                >
                  <p className="truncate text-[13px] font-bold">{ind.shortName}</p>
                  <p className="text-[11px] text-muted-foreground">{ind.country}</p>
                  <p className="tabular mt-2 text-[22px] font-extrabold leading-none">
                    {formatValue(ind, l.value)}
                    <span className="ml-1 text-[11px] font-semibold text-muted-foreground">{ind.unit}</span>
                  </p>
                  <div className="mt-1.5">
                    <Delta value={l.changeYoY} />
                  </div>
                  <div className="mt-2 h-9">
                    <Sparkline data={ind.series.slice(-20)} negative={l.changeYoY < 0} height={36} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mb-7">
          <SectionTitle
            title="Recent analyses"
            right={
              items.length > 0 ? (
                <Link to="/insights" className="text-[13px] font-bold text-primary">
                  See all
                </Link>
              ) : undefined
            }
          />
          {items.length === 0 ? (
            <EmptyState
              title="No analyses yet"
              body="Choose an economic target and explore what factors may be associated with it."
              action={
                <Link to="/analyze">
                  <Button>Start your first analysis</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {items.slice(0, 4).map((a) => (
                <Card key={a.id}>
                  <p className="text-[15px] font-bold">
                    {a.country} {a.target.label} analysis
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {a.variables.length} variables · {a.from}–{a.to} · updated {relativeTime(a.savedAt)}
                  </p>
                  <div className="tabular mt-3 flex gap-5 text-[13px] font-semibold">
                    <span>R² {a.regression.metrics.r_squared.toFixed(2)}</span>
                    <span>RMSE {a.regression.metrics.rmse.toFixed(2)}</span>
                  </div>
                  <Link
                    to="/insights"
                    className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-primary"
                  >
                    Open analysis <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle title="Popular targets" hint="What other people analyse most." />
          <div className="flex flex-wrap gap-2">
            {popularTargets.map((id) => {
              const ind = indicators.find((i) => i.id === id);
              if (!ind) return null;
              return (
                <Link
                  key={id}
                  to="/analyze"
                  search={{ target: id }}
                  className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
                >
                  {ind.shortName}
                </Link>
              );
            })}
          </div>
        </section>
      </Page>
    </AppShell>
  );
}
