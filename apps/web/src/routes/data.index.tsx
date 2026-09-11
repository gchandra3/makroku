import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { AppShell, Page, PageHeader } from "@/components/app-shell";
import { IndicatorCard } from "@/components/indicator-card";
import { Chip, EmptyState } from "@/components/ui-kit";
import { categories, countries, indicators as mockIndicators } from "@/lib/econ-data";
import type { Indicator } from "@/lib/econ-data";
import { fetchIndicators } from "@/api/client";

export const Route = createFileRoute("/data/")({
  loader: async () => {
    const list = (await fetchIndicators()) ?? mockIndicators;
    return list;
  },
  head: () => ({
    meta: [
      { title: "Economic Indicators Explorer | MacroCast" },
      {
        name: "description",
        content:
          "Browse quarterly indicators for Indonesia, Hong Kong and Singapore — inflation, GDP, employment, rates, trade, energy and currency.",
      },
      { property: "og:title", content: "Economic Indicators Explorer | MacroCast" },
      {
        property: "og:description",
        content: "Search indicators, inspect their history and add them straight into an analysis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DataPage,
});

function DataPage() {
  const loaderData = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<string>("Indonesia");
  const [category, setCategory] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return loaderData.filter(
      (i) =>
        i.country === country &&
        (!category || i.category === category) &&
        (q === "" || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)),
    );
  }, [query, country, category, loaderData]);

  return (
    <AppShell>
      <Page>
        <PageHeader title="Economic indicators" subtitle="Quarterly series, 2010 Q1 – 2025 Q4." />

        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <label className="sr-only" htmlFor="data-search">
            Search indicators
          </label>
          <input
            id="data-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search indicators…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {countries.map((c) => (
            <Chip key={c} active={c === country} onClick={() => setCountry(c)}>
              {c}
            </Chip>
          ))}
        </div>

        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
          <Chip active={category === null} onClick={() => setCategory(null)}>
            All
          </Chip>
          {categories.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {list.map((ind) => (
            <IndicatorCard key={ind.id} indicator={ind} />
          ))}
        </div>

        {list.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No indicators found" body="Try a different search term, country or category." />
          </div>
        ) : null}
      </Page>
    </AppShell>
  );
}
