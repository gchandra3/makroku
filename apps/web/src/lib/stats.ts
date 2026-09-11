/**
 * Deterministic statistical engine: multiple linear regression (OLS).
 * All statistics used anywhere in the product are produced here — never in the
 * UI layer and never by a language model.
 */

export type Coefficient = {
  variable: string;
  label: string;
  coefficient: number;
  std_error: number;
  t_stat: number;
  p_value: number;
  confidence_interval: [number, number];
  significant: boolean;
  vif: number | null;
};

export type RegressionResult = {
  observations: number;
  metrics: {
    r_squared: number;
    adjusted_r_squared: number;
    rmse: number;
    f_stat: number;
    df: number;
  };
  intercept: Coefficient;
  coefficients: Coefficient[];
  fitted: number[];
  residuals: number[];
  actual: number[];
  periods: string[];
  diagnostics: {
    high_vif: string[];
    durbin_watson: number;
    significance_level: number;
  };
};

/* ---------- linear algebra ---------- */

function solve(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]!]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r]![c]!) > Math.abs(M[piv]![c]!)) piv = r;
    if (Math.abs(M[piv]![c]!) < 1e-12) return null;
    [M[c], M[piv]] = [M[piv]!, M[c]!];
    const p = M[c]![c]!;
    for (let j = c; j <= n; j++) M[c]![j]! /= p;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r]![c]!;
      if (!f) continue;
      for (let j = c; j <= n; j++) M[r]![j]! -= f * M[c]![j]!;
    }
  }
  return M.map((row) => row[n]!);
}

function inverse(A: number[][]): number[][] | null {
  const n = A.length;
  const out: number[][] = [];
  for (let i = 0; i < n; i++) {
    const e = Array.from({ length: n }, (_, j) => (i === j ? 1 : 0));
    const col = solve(A.map((r) => [...r]), e);
    if (!col) return null;
    out.push(col);
  }
  // out currently holds columns; transpose to rows
  return out[0]!.map((_, i) => out.map((c) => c[i]!));
}

/* ---------- t distribution ---------- */

function logGamma(x: number) {
  const c = [76.18009172947146, -86.50532032941678, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j]! / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betacf(a: number, b: number, x: number) {
  const FPMIN = 1e-300;
  let qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-12) break;
  }
  return h;
}

function ibeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** Two-sided p-value for a t statistic. */
export function tPValue(t: number, df: number) {
  if (!isFinite(t) || df <= 0) return 1;
  return ibeta(df / 2, 0.5, df / (df + t * t));
}

/** Approximate two-sided t critical value via bisection. */
function tCritical(df: number, alpha: number) {
  let lo = 0, hi = 100;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (tPValue(mid, df) > alpha) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/* ---------- OLS ---------- */

export type RegressionInput = {
  y: number[];
  periods: string[];
  variables: { key: string; label: string; values: number[] }[];
  significanceLevel?: number;
  standardize?: boolean;
};

export function runRegression(input: RegressionInput): RegressionResult | { error: string } {
  const alpha = input.significanceLevel ?? 0.05;
  const n = input.y.length;
  const k = input.variables.length;
  if (k === 0) return { error: "Select at least one explanatory variable." };
  if (n < k + 3) return { error: `Not enough overlapping observations (${n}) for ${k} variables.` };

  const cols = input.variables.map((v) => v.values);
  const X = Array.from({ length: n }, (_, i) => [1, ...cols.map((c) => c[i]!)]);
  const p = k + 1;

  const XtX = Array.from({ length: p }, (_, a) =>
    Array.from({ length: p }, (_, b) => X.reduce((s, row) => s + row[a]! * row[b]!, 0)),
  );
  const Xty = Array.from({ length: p }, (_, a) => X.reduce((s, row, i) => s + row[a]! * input.y[i]!, 0));
  const beta = solve(XtX.map((r) => [...r]), Xty);
  const XtXinv = inverse(XtX.map((r) => [...r]));
  if (!beta || !XtXinv) return { error: "The variable set is perfectly collinear and the model cannot be estimated." };

  const fitted = X.map((row) => row.reduce((s, v, j) => s + v * beta[j]!, 0));
  const residuals = input.y.map((v, i) => v - fitted[i]!);
  const ybar = input.y.reduce((a, b) => a + b, 0) / n;
  const ssTot = input.y.reduce((s, v) => s + (v - ybar) ** 2, 0);
  const ssRes = residuals.reduce((s, r) => s + r * r, 0);
  const df = n - p;
  const sigma2 = ssRes / df;
  const r2 = 1 - ssRes / ssTot;
  const adj = 1 - (1 - r2) * ((n - 1) / df);
  const rmse = Math.sqrt(ssRes / n);
  const fStat = (r2 / k) / ((1 - r2) / df);
  const crit = tCritical(df, alpha);

  const mkCoef = (j: number, key: string, label: string, vif: number | null): Coefficient => {
    const est = beta[j]!;
    const se = Math.sqrt(Math.max(sigma2 * XtXinv[j]![j]!, 0));
    const t = se > 0 ? est / se : 0;
    const pv = tPValue(t, df);
    return {
      variable: key,
      label,
      coefficient: r4(est),
      std_error: r4(se),
      t_stat: r4(t),
      p_value: Number(pv.toFixed(4)),
      confidence_interval: [r4(est - crit * se), r4(est + crit * se)],
      significant: pv < alpha,
      vif,
    };
  };

  const vifs = input.variables.map((v, idx) => {
    const others = input.variables.filter((_, i) => i !== idx);
    if (others.length === 0) return 1;
    const sub = runRegressionRaw(v.values, others.map((o) => o.values));
    if (sub === null || sub >= 0.999) return 999;
    return r2num(1 / (1 - sub));
  });

  const coefficients = input.variables.map((v, i) => mkCoef(i + 1, v.key, v.label, vifs[i]!));

  let dwNum = 0;
  for (let i = 1; i < n; i++) dwNum += (residuals[i]! - residuals[i - 1]!) ** 2;

  return {
    observations: n,
    metrics: {
      r_squared: r2num(r2),
      adjusted_r_squared: r2num(adj),
      rmse: r2num(rmse),
      f_stat: r2num(fStat),
      df,
    },
    intercept: mkCoef(0, "intercept", "Intercept", null),
    coefficients,
    fitted: fitted.map((v) => r4(v)),
    residuals: residuals.map((v) => r4(v)),
    actual: input.y,
    periods: input.periods,
    diagnostics: {
      high_vif: coefficients.filter((c) => (c.vif ?? 0) > 5).map((c) => c.label),
      durbin_watson: r2num(dwNum / ssRes),
      significance_level: alpha,
    },
  };
}

/** R² of an auxiliary regression, used for VIF. */
function runRegressionRaw(y: number[], cols: number[][]): number | null {
  const n = y.length;
  const p = cols.length + 1;
  const X = Array.from({ length: n }, (_, i) => [1, ...cols.map((c) => c[i]!)]);
  const XtX = Array.from({ length: p }, (_, a) =>
    Array.from({ length: p }, (_, b) => X.reduce((s, row) => s + row[a]! * row[b]!, 0)),
  );
  const Xty = Array.from({ length: p }, (_, a) => X.reduce((s, row, i) => s + row[a]! * y[i]!, 0));
  const beta = solve(XtX, Xty);
  if (!beta) return null;
  const fitted = X.map((row) => row.reduce((s, v, j) => s + v * beta[j]!, 0));
  const ybar = y.reduce((a, b) => a + b, 0) / n;
  const ssTot = y.reduce((s, v) => s + (v - ybar) ** 2, 0);
  const ssRes = y.reduce((s, v, i) => s + (v - fitted[i]!) ** 2, 0);
  return ssTot === 0 ? null : 1 - ssRes / ssTot;
}

export function predict(result: RegressionResult, values: Record<string, number>) {
  let point = result.intercept.coefficient;
  for (const c of result.coefficients) point += c.coefficient * (values[c.variable] ?? 0);
  const margin = 1.96 * result.metrics.rmse;
  return {
    point: r2num(point),
    lower: r2num(point - margin),
    upper: r2num(point + margin),
  };
}

const r4 = (v: number) => Number(v.toFixed(4));
const r2num = (v: number) => Number(v.toFixed(3));
