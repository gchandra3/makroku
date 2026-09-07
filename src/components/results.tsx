import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ActualPredictedChart, CoefficientChart } from "@/components/charts";
import { AiPanel } from "@/components/ai-panel";
import { Button, Card, MetricCard, SectionTitle, SignificanceTag, Warning } from "@/components/ui-kit";
import type { AnalysisResult } from "@/lib/analysis.functions";

export function aiPayload(result: AnalysisResult) {
  const { regression } = result;
  return JSON.stringify({
    target: result.target.label,
    country: result.country,
    period: result.quality.period,
    observations: regression.observations,
    unit: result.target.unit,
    metrics: regression.metrics,
    significance_level: regression.diagnostics.significance_level,
    coefficients: regression.coefficients.map((c) => ({
      variable: c.label,
      coefficient: c.coefficient,
      std_error: c.std_error,
      p_value: c.p_value,
      confidence_interval: c.confidence_interval,
      significant: c.significant,
      vif: c.vif,
    })),
    diagnostics: regression.diagnostics,
    data_warnings: result.quality.warnings,
  });
}

export function ResultsView({ result, actions }: { result: AnalysisResult; actions?: React.ReactNode }) {
  const { regression: r } = result;
  const [showActual, setShowActual] = useState(true);
  const [showPredicted, setShowPredicted] = useState(true);
  const [openTable, setOpenTable] = useState(false);
  const payload = aiPayload(result);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-extrabold tracking-tight">
            {result.target.label} — {result.country}
          </h2>
          <p className="text-[13px] text-muted-foreground">
            {result.quality.period} · {result.variables.length} explanatory variables
          </p>
        </div>
        {actions}
      </div>

      {result.quality.warnings.map((w) => (
        <Warning key={w} title="Data note" body={w} />
      ))}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="R²"
          value={r.metrics.r_squared.toFixed(2)}
          sub="of variation explained"
          tip="The share of the variation in the target that the variables in this model account for. It does not prove the variables cause the outcome."
        />
        <MetricCard
          label="Adj. R²"
          value={r.metrics.adjusted_r_squared.toFixed(2)}
          sub="penalised for variable count"
          tip="R² adjusted for how many variables are in the model, so adding variables does not automatically improve it."
        />
        <MetricCard
          label="RMSE"
          value={r.metrics.rmse.toFixed(2)}
          sub={result.target.unit}
          tip="Root mean squared error: the typical size of the gap between actual values and model-fitted values."
        />
        <MetricCard label="Observations" value={String(r.observations)} sub={`${r.metrics.df} degrees of freedom`} />
      </div>

      <Card>
        <SectionTitle
          title={`What is associated with ${result.target.label.toLowerCase()}?`}
          hint={`Bars show each estimated coefficient. Filled colour marks results significant at the ${(r.diagnostics.significance_level * 100).toFixed(0)}% level.`}
        />
        <CoefficientChart coefficients={r.coefficients} />

        <button
          type="button"
          onClick={() => setOpenTable((v) => !v)}
          className="mt-4 flex items-center gap-1.5 text-[13px] font-bold text-primary"
          aria-expanded={openTable}
        >
          <ChevronDown className={openTable ? "h-4 w-4 rotate-180 transition-transform" : "h-4 w-4 transition-transform"} />
          {openTable ? "Hide full regression output" : "Show full regression output"}
        </button>

        {openTable ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-[13px]">
              <caption className="sr-only">Regression coefficients, standard errors, p-values and confidence intervals</caption>
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Variable</th>
                  <th className="py-2 pr-3 font-semibold">Coefficient</th>
                  <th className="py-2 pr-3 font-semibold">Std. error</th>
                  <th className="py-2 pr-3 font-semibold">t</th>
                  <th className="py-2 pr-3 font-semibold">p-value</th>
                  <th className="py-2 pr-3 font-semibold">95% CI</th>
                  <th className="py-2 pr-3 font-semibold">VIF</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {[r.intercept, ...r.coefficients].map((c) => (
                  <tr key={c.variable} className="border-b border-border/70">
                    <td className="py-2 pr-3 font-semibold">{c.label}</td>
                    <td className="py-2 pr-3">{c.coefficient.toFixed(3)}</td>
                    <td className="py-2 pr-3">{c.std_error.toFixed(3)}</td>
                    <td className="py-2 pr-3">{c.t_stat.toFixed(2)}</td>
                    <td className="py-2 pr-3">{c.p_value.toFixed(3)}</td>
                    <td className="py-2 pr-3">
                      {c.confidence_interval[0].toFixed(2)} → {c.confidence_interval[1].toFixed(2)}
                    </td>
                    <td className="py-2 pr-3">{c.vif === null ? "—" : c.vif.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[12px] text-muted-foreground">
              Durbin–Watson {r.diagnostics.durbin_watson.toFixed(2)} · F-statistic {r.metrics.f_stat.toFixed(1)}
            </p>
          </div>
        ) : null}
      </Card>

      <Card>
        <SectionTitle title="Key findings" hint="Relationships below are associations within this model, not proven causes." />
        <ul className="space-y-2 text-[13px] leading-relaxed">
          {r.coefficients.map((c) => (
            <li key={c.variable} className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{c.label}</span>
              <span className="tabular">
                {c.coefficient >= 0 ? "+" : "−"}
                {Math.abs(c.coefficient).toFixed(3)} {c.coefficient >= 0 ? "↑" : "↓"}
              </span>
              <SignificanceTag significant={c.significant} />
              <span className="text-muted-foreground">
                {c.significant
                  ? `is associated with ${c.coefficient >= 0 ? "higher" : "lower"} ${result.target.label.toLowerCase()} (p = ${c.p_value.toFixed(3)}).`
                  : `shows no statistically detectable association at this level (p = ${c.p_value.toFixed(3)}).`}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle
          title={`Actual vs predicted ${result.target.label.toLowerCase()}`}
          right={
            <div className="flex gap-2">
              <Button variant={showActual ? "outline" : "ghost"} className="px-3 py-1.5 text-[12px]" onClick={() => setShowActual((v) => !v)}>
                Actual
              </Button>
              <Button variant={showPredicted ? "outline" : "ghost"} className="px-3 py-1.5 text-[12px]" onClick={() => setShowPredicted((v) => !v)}>
                Predicted
              </Button>
            </div>
          }
        />
        <div className="-mx-2 overflow-x-auto">
          <div className="min-w-[520px] px-2">
            <ActualPredictedChart
              periods={r.periods}
              actual={r.actual}
              fitted={r.fitted}
              unit={result.target.unit}
              showActual={showActual}
              showPredicted={showPredicted}
            />
          </div>
        </div>
      </Card>

      <AiPanel payload={payload} autoSummary />
    </div>
  );
}
