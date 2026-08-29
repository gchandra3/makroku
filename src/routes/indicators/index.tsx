import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { IndicatorCard } from "@/components/indicator-card";
import { countries, indicators, popularIds, recentIds } from "@/lib/macro-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/indicators/")({
  head: () => ({
    meta: [
      { title: "Economic Indicators Explorer | MacroCast" },
      {
        name: "description",
        content:
          "Search GDP, inflation, employment and interest-rate indicators for Indonesia, Hong Kong, Singapore and global markets.",
      },
      { property: "og:title", content: "Economic Indicators Explorer | MacroCast" },
      {
        property: "og:description",
        content:
          "Search-first discovery across inflation, GDP, employment and interest-rate series with live values and sparklines.",
      },
    ],
  }),
  component: Indicators,
});

const sections = ["Inflation", "GDP", "Employment", "Interest rates"] as const;

function Indicators() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<string>("Indonesia");

  const filtered = useMemo(
    () =>
      indicators.filter(
        (i) =>
          i.name.toLowerCase().includes(query.toLowerCase()) &&
          (query ? true : i.country === country),
      ),
    [query, country],
  );

  const searching = query.trim().length > 0;

  return (
    <AppShell>
      <PageHeader title="Indicators" subtitle="Find any series in a few taps" />

      <div className="sticky top-0 z-30 bg-background/90 px-5 pb-3 pt-1 backdrop-blur-md">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-card)]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search economic indicators..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          {countries.map((c) => (
            <button
              key={c}
              onClick={() => setCountry(c)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                country === c
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {searching ? (
        <Section title={`Results (${filtered.length})`}>
          {filtered.map((i) => (
            <IndicatorCard key={i.id} indicator={i} />
          ))}
          {filtered.length === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">
              No indicator matches “{query}”.
            </p>
          ) : null}
        </Section>
      ) : (
        <>
          <Section title="Popular indicators">
            {popularIds.map((id) => (
              <IndicatorCard key={id} indicator={indicators.find((i) => i.id === id)!} />
            ))}
          </Section>

          <Section title="Recently viewed">
            {recentIds.map((id) => (
              <IndicatorCard key={id} indicator={indicators.find((i) => i.id === id)!} />
            ))}
          </Section>

          {sections.map((s) => {
            const list = indicators.filter((i) => i.category === s);
            return (
              <Section key={s} title={s}>
                {list.map((i) => (
                  <IndicatorCard key={i.id} indicator={i} />
                ))}
              </Section>
            );
          })}
        </>
      )}
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 px-5">
      <h2 className="text-base font-bold">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
