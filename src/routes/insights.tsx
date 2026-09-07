import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Trash2 } from "lucide-react";
import { AppShell, Page, PageHeader } from "@/components/app-shell";
import { AiPanel } from "@/components/ai-panel";
import { ResultsView, aiPayload } from "@/components/results";
import { Button, Card, EmptyState, ErrorState, SectionTitle } from "@/components/ui-kit";
import { relativeTime, useSavedAnalyses, useCurrentAnalysis } from "@/lib/analysis-store";
import { askAnalyst } from "@/lib/analysis.functions";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Saved Analyses & Research Notes | MacroCast" },
      {
        name: "description",
        content:
          "Your research notebook: saved regression analyses, model performance at a glance and AI-written research notes grounded in the model output.",
      },
      { property: "og:title", content: "Saved Analyses & Research Notes | MacroCast" },
      {
        property: "og:description",
        content: "Revisit saved models, compare their fit and generate a structured research note.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Insights,
});

function Insights() {
  const { items, remove } = useSavedAnalyses();
  const current = useCurrentAnalysis();
  const [openId, setOpenId] = useState<string | null>(null);
  const ask = useServerFn(askAnalyst);
  const [note, setNote] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = items.find((a) => a.id === openId) ?? null;
  const focus = open ?? current;

  async function makeNote() {
    if (!focus) return;
    setBusy(true);
    setNoteError(null);
    const res = await ask({ data: { question: "Write the research note", mode: "note", payload: aiPayload(focus) } });
    setBusy(false);
    if (res.ok) setNote(res.text);
    else setNoteError(res.error);
  }

  return (
    <AppShell>
      <Page>
        <PageHeader title="Your research" subtitle="Saved analyses, model summaries and research notes." />

        {items.length === 0 && !current ? (
          <EmptyState
            title="No analyses yet"
            body="Choose an economic target and explore what factors may be associated with it."
            action={
              <Link to="/analyze">
                <Button>Start your first analysis</Button>
              </Link>
            }
          />
        ) : null}

        {items.length > 0 ? (
          <section className="mb-5">
            <SectionTitle title="Saved analyses" />
            <div className="grid gap-3 lg:grid-cols-2">
              {items.map((a) => {
                const sig = a.regression.coefficients.filter((c) => c.significant).length;
                return (
                  <Card key={a.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-bold">
                          {a.country} {a.target.label} analysis
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          R² {a.regression.metrics.r_squared.toFixed(2)} · {a.regression.observations} observations ·
                          saved {relativeTime(a.savedAt)}
                        </p>
                        <p className="mt-1 text-[13px]">
                          {sig} statistically significant variable{sig === 1 ? "" : "s"}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Delete ${a.target.label} analysis`}
                        onClick={() => remove(a.id)}
                        className="text-muted-foreground hover:text-negative"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3">
                      <Button variant="outline" onClick={() => setOpenId(openId === a.id ? null : a.id)}>
                        {openId === a.id ? "Close" : "Open"}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        ) : null}

        {focus ? (
          <>
            <section className="mb-5">
              <SectionTitle title="Research note" hint="Written from the model output — no numbers are invented." />
              <Card>
                <Button onClick={() => void makeNote()} disabled={busy}>
                  <FileText className="h-4 w-4" /> {busy ? "Writing…" : "Generate research note"}
                </Button>
                {noteError ? (
                  <div className="mt-3">
                    <ErrorState title="Could not write the note" body={noteError} />
                  </div>
                ) : null}
                {note ? (
                  <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-border bg-background p-4 text-[13px] leading-relaxed">
                    {note}
                  </div>
                ) : null}
              </Card>
            </section>

            {open ? (
              <ResultsView result={open} />
            ) : (
              <section className="space-y-4">
                <SectionTitle title="Current analysis" hint="The model you last ran." />
                <ResultsView result={focus} />
              </section>
            )}
          </>
        ) : null}

        {!focus && items.length === 0 ? null : focus ? null : <AiPanel payload="{}" />}
      </Page>
    </AppShell>
  );
}
