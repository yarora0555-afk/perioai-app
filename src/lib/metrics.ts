export const CATS = ["health", "gingivitis", "periodontitis"] as const;

export interface Pair {
  ai: string;
  truth: string;
  aiStage?: string | null;
  truthStage?: string | null;
}

export function computeMetrics(pairs: Pair[]) {
  const n = pairs.length;
  const matrix = CATS.map((t) => CATS.map((p) => pairs.filter((x) => x.truth === t && x.ai === p).length));
  const correct = CATS.reduce((s, _, i) => s + matrix[i][i], 0);
  const accuracy = n ? correct / n : 0;

  // Cohen's kappa
  let pe = 0;
  CATS.forEach((_, i) => {
    const rowSum = matrix[i].reduce((a, b) => a + b, 0);
    const colSum = matrix.reduce((a, r) => a + r[i], 0);
    pe += n ? (rowSum / n) * (colSum / n) : 0;
  });
  const kappa = n && pe < 1 ? (accuracy - pe) / (1 - pe) : 0;

  // Binary: periodontitis vs not
  const tp = pairs.filter((x) => x.truth === "periodontitis" && x.ai === "periodontitis").length;
  const fn = pairs.filter((x) => x.truth === "periodontitis" && x.ai !== "periodontitis").length;
  const fp = pairs.filter((x) => x.truth !== "periodontitis" && x.ai === "periodontitis").length;
  const tn = pairs.filter((x) => x.truth !== "periodontitis" && x.ai !== "periodontitis").length;
  const div = (a: number, b: number) => (b ? a / b : null);

  // Per-class sensitivity
  const perClass = CATS.map((c, i) => {
    const row = matrix[i].reduce((a, b) => a + b, 0);
    const col = matrix.reduce((a, r) => a + r[i], 0);
    const sens = div(matrix[i][i], row);
    const ppv = div(matrix[i][i], col);
    const f1 = sens !== null && ppv !== null && sens + ppv > 0 ? (2 * sens * ppv) / (sens + ppv) : null;
    return { cat: c, support: row, sensitivity: sens, ppv, f1 };
  });

  const staged = pairs.filter((x) => x.truth === "periodontitis" && x.ai === "periodontitis" && x.truthStage && x.aiStage);
  const stageAgree = staged.filter((x) => x.truthStage === x.aiStage).length;
  const stageWithinOne = staged.filter((x) => {
    const r = ["I", "II", "III", "IV"];
    return Math.abs(r.indexOf(x.truthStage!) - r.indexOf(x.aiStage!)) <= 1;
  }).length;

  return {
    n,
    matrix,
    accuracy,
    kappa,
    binary: {
      tp, fn, fp, tn,
      sensitivity: div(tp, tp + fn),
      specificity: div(tn, tn + fp),
      ppv: div(tp, tp + fp),
      npv: div(tn, tn + fn),
    },
    perClass,
    stage: { n: staged.length, exact: div(stageAgree, staged.length), withinOne: div(stageWithinOne, staged.length) },
  };
}

export function kappaLabel(k: number) {
  if (k < 0) return "Poor";
  if (k <= 0.2) return "Slight";
  if (k <= 0.4) return "Fair";
  if (k <= 0.6) return "Moderate";
  if (k <= 0.8) return "Substantial";
  return "Almost perfect";
}
