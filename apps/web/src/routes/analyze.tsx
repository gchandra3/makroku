import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Play, Save, Search, Settings2, X } from "lucide-react";
import { AppShell, Page, PageHeader } from "@/components/app-shell";
import { Sparkline } from "@/components/charts";
import { ResultsView } from "@/components/results";
import {
  Button,
  Card,
  Chip,
  ErrorState,
  LoadingState,
  SectionTitle,
  Warning,
  runStepCount,
} from "@/components/ui-kit";
import { useSavedAnalyses, setCurrentAnalysis } from "@/lib/analysis-store";
import { runAnalysis, type AnalysisResult } from "@/lib/analysis.functions";
import {
  byCountry,
  categories,
  countries,
  formatValue,
  getIndicator,
  indicators,
  latest,
  sliceByYears,
} from "@/lib/econ-data";

export const Route = createFileRoute("/analyze")({
  validateSearch: (s: Record<string, unknown>): { target?: string } =>
    typeof s["target"] === "string" ? { target: s["target"] } : {},
  head: () => ({
    meta: [
      { title: "Run an Economic Analysis | MacroCast" },
      {
        name: "description",
        content:
          "Select a target variable, add explanatory indicators and estimate a multiple linear regression with coefficients, p-values and confidence intervals.",
      },
      { property: "og:title", content: "Run an Economic Analysis | MacroCast" },
      {
        property: "og:description",
        content: "Guided regression workflow: target, variables, period, results and plain-language interpretation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Analyze,
});

function Analyze() {
  const search = Route.useSearch();
  const initial = (search.target && getIndicator(search.target)) || getIndicator("indonesia-cpi")!;

  const [country, setCountry] = useState<string>(initial.country);
  const [targetId, setTargetId] = useState(initial.id);
  const [selected, setSelected] = useState<string[]>(() =>
    ["policy-rate", "oil", "fx", "gdp", "unemployment"]
      .map((s) => `${initial.country.toLowerCase().replace(/\s+/g, "-")}-${s}`)
      .filter((id) => id !== initial.id && Boolean(getIndicator(id))),
  );
  const [from, setFrom] = useState(2010);
  const [to, setTo] = useState(2025);
  const [significance, setSignificance] = useState(0.05);
  const [query, setQuery] = useState("");
  const [advanced, setAdvanced] = useState(false);

  const [step, setStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saved, setSaved] = useState(false);

  const run = useServerFn(runAnalysis);
  const { save } = useSavedAnalyses();

  const pool = useMemo(() => byCountry(country), [country]);
  const target = getIndicator(targetId)!;
  const options = useMemo(
    () =>
      pool
        .filter((i) => i.id !== targetId)
        .filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase())),
    [pool, targetId, query],
  );

  const overlap = sliceByYears(target, from, to).length;

  function switchCountry(c: string) {
    setCountry(c);
    const slug = c.toLowerCase().replace(/\s+/g, "-");
    const suffix = targetId.split("-").slice(country.split(" ").length).join("-");
    const nextTarget = getIndicator(`${slug}-${suffix}`)?.id ?? byCountry(c)[0]!.id;
    setTargetId(nextTarget);
    setSelected((ids) =>
      ids
        .map((id) => `${slug}-${id.split("-").slice(1).join("-")}`)
        .filter((id) => Boolean(getIndicator(id)) && id !== nextTarget),
    );
  }

  function toggle(id: string) {
    setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function onRun() {
    setError(null);
    setResult(null);
    setSaved(false);
    for (let i = 0; i < runStepCount; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 160));
    }
    const res = await run({ data: { targetId, variableIds: selected, from, to, significance } });
    setStep(-1);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult(res.result);
    setCurrentAnalysis(res.result);
  }

  return (
    <AppShell>
      <Page>
        <PageHeader
          title="New economic analysis"
          subtitle="Understand which economic variables are associated with changes in your selected target."
        />

        {/* Step 1 */}
        <Card className="mb-4">
          <SectionTitle
            title="1 · What do you want to analyse?"
            hint="The target variable is the outcome the model tries to explain."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[12px] font-semibold text-muted-foreground">Target variable</span>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold"
              >
                {pool.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="text-[12px] font-semibold text-muted-foreground">Country</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {countries.map((c) => (
                  <Chip key={c} active={c === country} onClick={() => switchCountry(c)}>
                    {c}
                  </Chip>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-[12px] font-semibold text-muted-foreground">From year</span>
              <input
                type="range"
                min={2010}
                max={to - 3}
                value={from}
                onChange={(e) => setFrom(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--color-primary)]"
              />
              <span className="tabular text-[13px] font-bold">{from}</span>
            </label>

            <label className="block">
              <span className="text-[12px] font-semibold text-muted-foreground">To year</span>
              <input
                type="range"
                min={from + 3}
                max={2025}
                value={to}
                onChange={(e) => setTo(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--color-primary)]"
              />
              <span className="tabular text-[13px] font-bold">{to}</span>
            </label>
          </div>

          <p className="mt-3 text-[12px] text-muted-foreground">
            {target.description} · {target.source} · {target.frequency} · {target.coverage}
          </p>
        </Card>

        {/* Step 2 */}
        <Card className="mb-4">
          <SectionTitle
            title={`2 · What might influence ${target.shortName.toLowerCase()}?`}
            hint="Pick the indicators the model should test. You can change them and re-run at any time."
          />

          <div className="mb-3 flex flex-wrap gap-2">
            {selected.map((id) => {
              const ind = getIndicator(id)!;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-[12px] font-bold text-primary"
                >
                  <Check className="h-3 w-3" /> {ind.shortName} <X className="h-3 w-3" />
                </button>
              );
            })}
            {selected.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No variables selected yet.</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <label className="sr-only" htmlFor="var-search">
              Search indicators
            </label>
            <input
              id="var-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search indicators…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <ul className="mt-3 divide-y divide-border">
            {options.map((ind) => {
              const on = selected.includes(ind.id);
              const l = latest(ind);
              return (
                <li key={ind.id}>
                  <button
                    type="button"
                    onClick={() => toggle(ind.id)}
                    aria-pressed={on}
                    className="flex w-full items-center gap-3 py-2.5 text-left"
                  >
                    <span
                      className={
                        on
                          ? "grid h-5 w-5 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"
                          : "grid h-5 w-5 shrink-0 place-items-center rounded-md border border-border"
                      }
                    >
                      {on ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{ind.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {ind.category} · {ind.unit} · {ind.frequency} · {ind.source}
                      </span>
                    </span>
                    <span className="hidden w-24 sm:block">
                      <Sparkline data={ind.series.slice(-16)} negative={l.changeYoY < 0} height={26} />
                    </span>
                    <span className="tabular w-16 text-right text-[13px] font-bold">
                      {formatValue(ind, l.value)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <span key={c} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                {c}
              </span>
            ))}
          </div>
        </Card>

        {/* Data check */}
        <Card className="mb-4">
          <SectionTitle title="3 · Dataset check" hint="Checked before the model is estimated." />
          <dl className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
            <Fact label="Observations" value={String(overlap)} />
            <Fact label="Variables" value={String(selected.length)} />
            <Fact label="Time period" value={`${from} Q1 – ${to} Q4`} />
            <Fact label="Frequency" value="Quarterly" />
          </dl>
          {overlap < 20 ? (
            <div className="mt-3">
              <Warning
                title="Short estimation window"
                body={`Your selection only overlaps for ${overlap} quarters. At least 20 observations are recommended for stable estimates.`}
              />
            </div>
          ) : null}
        </Card>

        {/* Advanced */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            aria-expanded={advanced}
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="h-4 w-4" /> Advanced model settings
          </button>
          {advanced ? (
            <Card className="mt-2">
              <p className="text-[13px] font-semibold">Model</p>
              <p className="text-[12px] text-muted-foreground">Multiple linear regression (OLS)</p>
              <label className="mt-3 block text-[13px] font-semibold">
                Significance level
                <select
                  value={significance}
                  onChange={(e) => setSignificance(Number(e.target.value))}
                  className="mt-1 block w-32 rounded-xl border border-border bg-card px-3 py-2 text-sm"
                >
                  <option value={0.01}>0.01</option>
                  <option value={0.05}>0.05</option>
                  <option value={0.1}>0.10</option>
                </select>
              </label>
            </Card>
          ) : null}
        </div>

        <div className="mb-6">
          <Button onClick={() => void onRun()} disabled={step >= 0 || selected.length === 0}>
            <Play className="h-4 w-4" /> {step >= 0 ? "Running…" : "Run analysis"}
          </Button>
        </div>

        {step >= 0 ? <LoadingState step={step} /> : null}

        {error ? (
          <ErrorState
            title="The model could not be estimated"
            body={error}
            action={<Button variant="outline" onClick={() => setError(null)}>Modify variables</Button>}
          />
        ) : null}

        {result ? (
          <ResultsView
            result={result}
            actions={
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    save(result);
                    setSaved(true);
                  }}
                >
                  <Save className="h-4 w-4" /> {saved ? "Saved" : "Save analysis"}
                </Button>
                <Link to="/predictions">
                  <Button variant="outline">Explore prediction</Button>
                </Link>
              </div>
            }
          />
        ) : null}
      </Page>
    </AppShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="tabular font-bold">{value}</dd>
    </div>
  );
}
