import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell, Page } from "@/components/app-shell";
import { SeriesChart } from "@/components/charts";
import { Button, Card, Chip, Delta, EmptyState, SectionTitle } from "@/components/ui-kit";
import { fetchIndicator } from "@/api/client";
import { formatValue, getIndicator, latest } from "@/lib/econ-data";

export const Route = createFileRoute("/data/$indicatorId")({
  loader: async ({ params }) => {
    // Try API first, fall back to mock
    const ind = (await fetchIndicator(params.indicatorId)) ?? getIndicator(params.indicatorId);
    if (!ind) throw notFound();
    return ind;
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Indicator unavailable | MacroCast" }, { name: "robots", content: "noindex" }] };
    const title = `${loaderData.name} — ${loaderData.country} | MacroCast`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: NotFoundIndicator,
  component: IndicatorDetail,
});

const RANGES = [
  { label: "5Y", years: 5 },
  { label: "10Y", years: 10 },
  { label: "Max", years: 100 },
];

function IndicatorDetail() {
  const { indicatorId } = Route.useParams();
  const ind = Route.useLoaderData()!;
  const l = latest(ind);
  const [range, setRange] = useState(2);

  const points = RANGES[range]!.years >= 100 ? ind.series : ind.series.slice(-RANGES[range]!.years * 4);

  return (
    <AppShell>
      <Page>
        <Link to="/data" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> All indicators
        </Link>

        <h1 className="text-[24px] font-extrabold tracking-tight">
          {ind.name} — {ind.country}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          {ind.category} · {ind.frequency}
        </p>

        <div className="mt-3 flex items-end gap-3">
          <p className="tabular text-[44px] font-extrabold leading-none">
            {formatValue(ind, l.value)}
            <span className="ml-1.5 text-[14px] font-semibold text-muted-foreground">{ind.unit}</span>
          </p>
          <Delta value={l.changeYoY} />
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">Latest observation {l.period} · change vs a year earlier</p>

        <Card className="mt-4">
          <SectionTitle
            title="History"
            right={
              <div className="flex gap-2">
                {RANGES.map((r, i) => (
                  <Chip key={r.label} active={i === range} onClick={() => setRange(i)}>
                    {r.label}
                  </Chip>
                ))}
              </div>
            }
          />
          <SeriesChart data={points} unit={ind.unit} />
        </Card>

        <Card className="mt-4">
          <SectionTitle title="About this indicator" />
          <p className="text-[13px] leading-relaxed text-muted-foreground">{ind.description}</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
            <Row label="Frequency" value={ind.frequency} />
            <Row label="Unit" value={ind.unit} />
            <Row label="Coverage" value={ind.coverage} />
            <Row label="Observations" value={String(ind.series.length)} />
            <Row label="Source" value={ind.source} />
            <Row label="Last updated" value={ind.updated} />
          </dl>
        </Card>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/analyze" search={{ target: ind.id }}>
            <Button>Use as target</Button>
          </Link>
          <Link to="/analyze" search={{ target: ind.id }}>
            <Button variant="outline">Add as variable</Button>
          </Link>
        </div>
      </Page>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function NotFoundIndicator() {
  return (
    <AppShell>
      <Page>
        <EmptyState
          title="Indicator not found"
          body="That series is not part of the current dataset."
          action={
            <Link to="/data">
              <Button>Browse indicators</Button>
            </Link>
          }
        />
      </Page>
    </AppShell>
  );
}
