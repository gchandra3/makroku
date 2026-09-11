import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ChevronRight, Download, Globe2, HelpCircle, Sigma } from "lucide-react";
import { AppShell, Page, PageHeader } from "@/components/app-shell";
import { Card, SectionTitle } from "@/components/ui-kit";
import { useSavedAnalyses } from "@/lib/analysis-store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Settings | MacroCast" },
      {
        name: "description",
        content:
          "Your MacroCast workspace: default region, significance level, alerts, export format and the data sources behind every series.",
      },
      { property: "og:title", content: "Profile & Settings | MacroCast" },
      {
        property: "og:description",
        content: "Workspace preferences and the methodology behind MacroCast's regression engine.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

const settings = [
  { icon: Globe2, label: "Default region", value: "Indonesia" },
  { icon: Sigma, label: "Significance level", value: "0.05" },
  { icon: Bell, label: "Analysis alerts", value: "Weekly" },
  { icon: Download, label: "Export format", value: "CSV" },
  { icon: HelpCircle, label: "Help & feedback", value: "" },
];

function Profile() {
  const { items } = useSavedAnalyses();

  return (
    <AppShell>
      <Page>
        <PageHeader title="Profile" subtitle="Your workspace settings." />

        <Card className="mb-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-xl font-extrabold text-primary-foreground">
              GJ
            </span>
            <div>
              <p className="text-base font-extrabold">Glenn J.</p>
              <p className="text-[12px] text-muted-foreground">Economics &amp; Data Science</p>
            </div>
          </div>
        </Card>

        <section className="mb-4 grid grid-cols-3 gap-3">
          <Stat value={String(items.length)} label="Saved analyses" />
          <Stat
            value={String(new Set(items.map((a) => a.target.id)).size)}
            label="Targets studied"
          />
          <Stat
            value={String(new Set(items.flatMap((a) => a.variables.map((v) => v.id))).size)}
            label="Variables used"
          />
        </section>

        <section className="mb-4">
          <SectionTitle title="Preferences" />
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {settings.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <span className="flex-1 text-[13px] font-medium">{label}</span>
                <span className="text-[12px] text-muted-foreground">{value}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle title="Methodology & data sources" />
          <Card>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Every statistic in MacroCast comes from a deterministic ordinary least squares engine: coefficients,
              standard errors, t-statistics, p-values, confidence intervals, variance inflation factors and
              Durbin–Watson. The AI layer only puts those numbers into words — it never calculates or changes them,
              and relationships are reported as associations rather than proven causes.
            </p>
            <p className="mt-2 text-[12px] text-muted-foreground">
              Sample series modelled on World Bank, FRED, IMF, ILO and national statistics publications.
            </p>
            <Link to="/insights" className="mt-3 inline-block text-[13px] font-bold text-primary">
              Go to your research
            </Link>
          </Card>
        </section>
      </Page>
    </AppShell>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-2 py-3 text-center">
      <p className="tabular text-xl font-extrabold">{value}</p>
      <p className="text-[10px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}
