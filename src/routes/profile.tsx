import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Download,
  Globe2,
  HelpCircle,
  Star,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile & Preferences | MacroCast" },
      {
        name: "description",
        content:
          "Manage your saved indicators, default region, forecast alerts and data export preferences in MacroCast.",
      },
      { property: "og:title", content: "Your Profile & Preferences | MacroCast" },
      {
        property: "og:description",
        content: "Saved indicators, alerts, default region and exports — all in one place.",
      },
    ],
  }),
  component: Profile,
});

const settings = [
  { icon: Globe2, label: "Default region", value: "Indonesia" },
  { icon: Bell, label: "Forecast alerts", value: "Weekly" },
  { icon: Download, label: "Export format", value: "CSV" },
  { icon: HelpCircle, label: "Help & feedback", value: "" },
];

function Profile() {
  return (
    <AppShell>
      <PageHeader title="Profile" subtitle="Your workspace settings" />

      <section className="px-5">
        <div className="surface-card gradient-green-soft flex items-center gap-4 p-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-primary-foreground">
            AR
          </span>
          <div>
            <p className="text-base font-extrabold">Ayu Rahmawati</p>
            <p className="text-[12px] text-muted-foreground">
              Economics & Data Science · Semester 5
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-3 px-5">
        <Stat value="12" label="Saved series" />
        <Stat value="34" label="Forecasts run" />
        <Stat value="4" label="Models used" />
      </section>

      <section className="mt-5 px-5">
        <h2 className="text-base font-bold">Saved indicators</h2>
        <div className="mt-3 space-y-2">
          <SavedRow id="id-gdp-growth" name="Indonesia GDP Growth" value="5.1%" />
          <SavedRow id="id-cpi" name="Indonesia CPI Inflation" value="2.8%" />
          <SavedRow id="hk-cpi" name="Hong Kong CPI Inflation" value="1.9%" />
        </div>
      </section>

      <section className="mt-5 px-5">
        <h2 className="text-base font-bold">Preferences</h2>
        <div className="surface-card mt-3 divide-y divide-border overflow-hidden">
          {settings.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft">
                <Icon className="h-4 w-4 text-accent-foreground" />
              </span>
              <span className="flex-1 text-[13px] font-medium">{label}</span>
              <span className="text-[12px] text-muted-foreground">{value}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 px-5">
        <Link to="/research" className="surface-card flex items-center gap-3 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft">
            <BookOpen className="h-4 w-4 text-accent-foreground" />
          </span>
          <span className="flex-1">
            <span className="block text-[13px] font-bold">Methodology & data sources</span>
            <span className="block text-[11px] text-muted-foreground">
              World Bank · FRED · HK C&amp;SD
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </section>
    </AppShell>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="surface-card px-2 py-3 text-center">
      <p className="text-xl font-extrabold tabular">{value}</p>
      <p className="text-[10px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

function SavedRow({ id, name, value }: { id: string; name: string; value: string }) {
  return (
    <Link
      to="/indicators/$indicatorId"
      params={{ indicatorId: id }}
      className="surface-card flex items-center gap-3 px-4 py-3"
    >
      <Star className="h-4 w-4 text-primary" fill="currentColor" />
      <span className="flex-1 text-[13px] font-medium">{name}</span>
      <span className="text-[13px] font-bold tabular">{value}</span>
    </Link>
  );
}
