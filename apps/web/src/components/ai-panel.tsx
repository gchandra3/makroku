import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askAnalyst } from "@/lib/analysis.functions";
import { Button, Card, SectionTitle } from "@/components/ui-kit";

const SUGGESTIONS = [
  "Which variable matters most?",
  "Explain this analysis like I'm a beginner.",
  "Are there any problems with this model?",
  "What should I be cautious about?",
];

export function AiPanel({ payload, autoSummary = false }: { payload: string; autoSummary?: boolean }) {
  const ask = useServerFn(askAnalyst);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(question: string, mode: "insight" | "answer" | "note" = "answer") {
    if (busy) return;
    setBusy(true);
    setError(null);
    if (mode === "answer") setMessages((m) => [...m, { role: "user", text: question }]);
    const res = await ask({ data: { question, mode, payload } });
    if (res.ok) setMessages((m) => [...m, { role: "ai", text: res.text }]);
    else setError(res.error);
    setBusy(false);
  }

  return (
    <Card>
      <SectionTitle
        title="AI Economic Analyst"
        hint="Explains the statistics above in plain language. It never calculates or changes any number."
      />

      {autoSummary && messages.length === 0 ? (
        <Button variant="outline" onClick={() => void send("Summarise the findings", "insight")} disabled={busy}>
          <Sparkles className="h-4 w-4" /> {busy ? "Thinking…" : "Summarise key findings"}
        </Button>
      ) : null}

      <div className="mt-3 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl bg-secondary px-3.5 py-2 text-[13px] font-semibold"
                : "max-w-full whitespace-pre-wrap rounded-2xl border border-border bg-background px-3.5 py-3 text-[13px] leading-relaxed"
            }
          >
            {m.text}
          </div>
        ))}
        {busy ? <p className="text-[13px] text-muted-foreground">Reading the model output…</p> : null}
        {error ? <p className="text-[13px] font-semibold text-negative">{error}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void send(s)}
            disabled={busy}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          const q = input.trim();
          if (!q) return;
          setInput("");
          void send(q);
        }}
      >
        <label className="sr-only" htmlFor="ai-question">
          Ask a question about your results
        </label>
        <input
          id="ai-question"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your results…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button type="submit" aria-label="Send question" disabled={busy} className="text-primary disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </Card>
  );
}

/** Compact payload sent to the model — statistics only, no free text. */
export function buildPayload(obj: unknown) {
  return JSON.stringify(obj);
}
