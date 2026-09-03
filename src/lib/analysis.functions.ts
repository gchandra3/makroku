import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getIndicator, sliceByYears, type Indicator } from "@/lib/econ-data";
import { runRegression, type RegressionResult } from "@/lib/stats";

export type VariableMeta = {
  id: string;
  label: string;
  unit: string;
  source: string;
  frequency: string;
  lastValue: number;
};

export type DataQuality = {
  observations: number;
  variables: number;
  period: string;
  missing: number;
  frequency: string;
  warnings: string[];
};

export type AnalysisResult = {
  id: string;
  createdAt: string;
  target: VariableMeta & { country: string };
  country: string;
  from: number;
  to: number;
  variables: VariableMeta[];
  quality: DataQuality;
  regression: RegressionResult;
};

export type AnalysisResponse = { ok: true; result: AnalysisResult } | { ok: false; error: string };

const inputSchema = z.object({
  targetId: z.string(),
  variableIds: z.array(z.string()).min(1),
  from: z.number().int().min(2010).max(2025),
  to: z.number().int().min(2010).max(2025),
  significance: z.number().min(0.001).max(0.2).default(0.05),
});

function meta(ind: Indicator): VariableMeta {
  return {
    id: ind.id,
    label: ind.shortName,
    unit: ind.unit,
    source: ind.source,
    frequency: ind.frequency,
    lastValue: ind.series[ind.series.length - 1]!.value,
  };
}

export const runAnalysis = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<AnalysisResponse> => {
    const target = getIndicator(data.targetId);
    if (!target) return { ok: false, error: "Target indicator not found." };
    const vars = data.variableIds.map(getIndicator).filter(Boolean) as Indicator[];
    if (vars.length === 0) return { ok: false, error: "Select at least one explanatory variable." };

    const from = Math.min(data.from, data.to);
    const to = Math.max(data.from, data.to);
    const ySeries = sliceByYears(target, from, to);
    if (ySeries.length < 12)
      return {
        ok: false,
        error: `Your selection only covers ${ySeries.length} quarters. At least 20 observations are recommended for a stable model.`,
      };

    const periodList = ySeries.map((p) => p.period);
    const columns = vars.map((v) => {
      const map = new Map(v.series.map((p) => [p.period, p.value]));
      return { key: v.id, label: v.shortName, values: periodList.map((p) => map.get(p)), ind: v };
    });

    const missing = columns.reduce((s, c) => s + c.values.filter((v) => v === undefined).length, 0);
    const warnings: string[] = [];
    if (missing > 0) warnings.push(`${missing} observation(s) are unavailable and were dropped from the estimation window.`);
    if (periodList.length < 20) warnings.push("Fewer than 20 observations — coefficient estimates may be unstable.");

    const keepIdx = periodList.map((_, i) => i).filter((i) => columns.every((c) => c.values[i] !== undefined));
    const y = keepIdx.map((i) => ySeries[i]!.value);
    const usedPeriods = keepIdx.map((i) => periodList[i]!);

    const regression = runRegression({
      y,
      periods: usedPeriods,
      variables: columns.map((c) => ({ key: c.key, label: c.label, values: keepIdx.map((i) => c.values[i]!) })),
      significanceLevel: data.significance,
    });
    if ("error" in regression) return { ok: false, error: regression.error };

    if (regression.diagnostics.high_vif.length > 1)
      warnings.push(
        `${regression.diagnostics.high_vif.join(" and ")} are highly correlated with the other variables, which can make individual coefficients less stable.`,
      );

    return {
      ok: true,
      result: {
        id: `${target.id}-${from}-${to}-${vars.map((v) => v.id).join("_")}`,
        createdAt: new Date().toISOString(),
        target: { ...meta(target), country: target.country },
        country: target.country,
        from,
        to,
        variables: columns.map((c) => meta(c.ind)),
        quality: {
          observations: y.length,
          variables: vars.length,
          period: `${usedPeriods[0]} – ${usedPeriods[usedPeriods.length - 1]}`,
          missing,
          frequency: "Quarterly",
          warnings,
        },
        regression,
      },
    };
  });

/* ---------------- AI interpretation layer ---------------- */

const askSchema = z.object({
  question: z.string().min(1).max(500),
  mode: z.enum(["insight", "answer", "note"]).default("answer"),
  payload: z.string().min(2).max(20000),
});

const SYSTEM = `You are an economic analyst explaining the output of a multiple linear regression to a user.
Rules you must never break:
- Use ONLY the statistics contained in the JSON provided. Never calculate, alter, round differently, or invent coefficients, p-values, confidence intervals, R-squared, or any other number.
- Describe relationships as associations, never as causal effects, unless the user explicitly frames a causal design.
- Be concise, plain-spoken and concrete. Short paragraphs or bullets. No markdown headers deeper than "###".
- Mention statistical significance relative to the model's significance level, and flag limitations (sample size, collinearity, omitted variables) where the JSON supports it.`;

export type AiResponse = { ok: true; text: string } | { ok: false; error: string };

export const askAnalyst = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => askSchema.parse(d))
  .handler(async ({ data }): Promise<AiResponse> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "AI is not configured for this project." };

    const prompts: Record<string, string> = {
      insight: "Summarise the key findings of this model in 3-5 short bullets, naming the strongest significant associations and one caveat.",
      answer: data.question,
      note: "Write a structured research note with these sections: 1. Research question, 2. Data, 3. Methodology, 4. Results, 5. Key relationships, 6. Model performance, 7. Limitations, 8. Conclusion. Keep it tight and factual.",
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Regression output (authoritative):\n${data.payload}\n\nTask: ${prompts[data.mode]}` },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) return { ok: false, error: "Too many requests right now — try again in a moment." };
      if (res.status === 402) return { ok: false, error: "AI credits are exhausted for this workspace." };
      return { ok: false, error: `AI request failed (${res.status}). ${body.slice(0, 180)}` };
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return { ok: false, error: "The model returned an empty response." };
    return { ok: true, text };
  });
