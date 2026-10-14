import type {
  AnalysisResult,
  Category,
  ClinicalData,
  ImageFeatures,
  Smoking,
  TreatmentPhase,
} from "./types";

export const ENGINE_VERSION = "PerioAI Engine v1.0 (image feature model + AAP/EFP 2017 decision layer)";

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const round = (v: number, d = 0) => Math.round(v * 10 ** d) / 10 ** d;
const STAGES = ["I", "II", "III", "IV"] as const;
type Stage = (typeof STAGES)[number];

export interface EngineInput {
  clinical: ClinicalData;
  features?: ImageFeatures | null;
  age: number;
  smoking: Smoking | string;
}

export function analyze({ clinical: c, features, age, smoking }: EngineInput): AnalysisResult {
  const findings: string[] = [];
  const rationale: string[] = [];
  const warnings: string[] = [];

  // ---------- 1. Radiographic bone loss fusion ----------
  let rbl = 0;
  let rblSource: AnalysisResult["rblSource"] = "none";
  const aiRBL = features?.radiograph?.estimatedRBL;
  if (c.rblPercent !== null && c.rblPercent !== undefined && !Number.isNaN(c.rblPercent)) {
    rbl = c.rblPercent;
    rblSource = "clinician";
    if (aiRBL !== undefined && Math.abs(aiRBL - rbl) > 15) {
      warnings.push(
        `AI radiographic estimate (${round(aiRBL)}%) differs from recorded bone loss (${rbl}%) by >15%. Verify radiograph measurement.`,
      );
    }
  } else if (aiRBL !== undefined) {
    rbl = aiRBL;
    rblSource = "ai";
    rationale.push(`Radiographic bone loss estimated by image model at ${round(aiRBL)}% (no manual measurement entered).`);
  } else if (c.rblLocation !== "none") {
    rbl = c.rblLocation === "coronal" ? 12 : c.rblLocation === "middle" ? 45 : 75;
    rblSource = "clinician";
  }
  let rblLocation = c.rblLocation;
  if (rblLocation === "none" && rbl > 0) rblLocation = rbl > 66 ? "apical" : rbl > 33 ? "middle" : "coronal";

  // ---------- 2. Inflammation fusion ----------
  const photo = features?.photo;
  let inflammation = c.gingivalIndex;
  if (photo && photo.quality !== "poor") {
    inflammation = 0.65 * c.gingivalIndex + 0.35 * photo.inflammationScore;
    if (Math.abs(photo.inflammationScore - c.gingivalIndex) > 1.2) {
      warnings.push(
        `Photo-based inflammation score (${round(photo.inflammationScore, 1)}) disagrees with recorded Gingival Index (${c.gingivalIndex}). Re-check lighting or GI scoring.`,
      );
    }
  }
  if (photo?.quality === "poor") warnings.push("Intraoral photograph quality is poor — photo features were down-weighted.");
  if (features?.radiograph?.quality === "poor")
    warnings.push("Radiograph quality is poor — consider retaking (exclusion criterion: poor-quality radiographic records).");

  // ---------- 3. Probabilistic model ----------
  const pPerio = sigmoid(2.2 * (c.maxCAL - 0.5) + 0.06 * (rbl - 10) + 0.5 * (c.maxPD - 4));
  const pGingGivenNot = sigmoid(0.15 * (c.bopPercent - 10) + 1.0 * (inflammation - 1));
  const probabilities = {
    periodontitis: pPerio,
    gingivitis: (1 - pPerio) * pGingGivenNot,
    health: (1 - pPerio) * (1 - pGingGivenNot),
  };

  // ---------- 4. Rule-based classification (AAP/EFP 2017) ----------
  let category: Category;
  if (c.maxCAL >= 1 || (rbl >= 15 && c.maxPD >= 4)) {
    category = "periodontitis";
    rationale.push(
      c.maxCAL >= 1
        ? `Interdental clinical attachment loss detected (max CAL ${c.maxCAL} mm) → periodontitis case definition met.`
        : `Radiographic bone loss ${round(rbl)}% with pocketing ${c.maxPD} mm → periodontitis case definition met.`,
    );
  } else if (c.bopPercent >= 10) {
    category = "gingivitis";
    rationale.push(`No attachment loss; BOP ${c.bopPercent}% (≥10%) → dental plaque-induced gingivitis on intact periodontium.`);
  } else {
    category = "health";
    rationale.push(`BOP ${c.bopPercent}% (<10%), no attachment loss → clinical gingival health on intact periodontium.`);
  }

  let stage: Stage | null = null;
  let grade: "A" | "B" | "C" | null = null;
  let extent: string | null = null;
  let boneLossAgeRatio: number | null = null;
  let diagnosis = "";

  if (category === "periodontitis") {
    // Severity
    let idx = 0;
    if (c.maxCAL >= 5) idx = 2;
    else if (c.maxCAL >= 3) idx = 1;
    let rblIdx = 0;
    if (rbl > 33 || rblLocation === "middle" || rblLocation === "apical") rblIdx = 2;
    else if (rbl >= 15) rblIdx = 1;
    if (rblIdx > idx) {
      rationale.push(`Radiographic bone loss (${round(rbl)}%) indicates a higher stage than CAL alone.`);
      idx = rblIdx;
    }
    if (c.teethLostPerio >= 5) {
      idx = Math.max(idx, 3);
      rationale.push(`${c.teethLostPerio} teeth lost due to periodontitis (≥5) → Stage IV severity.`);
    } else if (c.teethLostPerio >= 1) {
      idx = Math.max(idx, 2);
      rationale.push(`${c.teethLostPerio} tooth/teeth lost due to periodontitis → at least Stage III.`);
    }
    // Complexity
    if (c.maxPD >= 6 || c.verticalDefect || c.furcation === "II" || c.furcation === "III") {
      if (idx < 2) rationale.push("Complexity factors (PD ≥6 mm, vertical defect ≥3 mm or furcation Class II/III) shift stage to III.");
      idx = Math.max(idx, 2);
    } else if (c.maxPD === 5 && idx < 1) {
      idx = 1;
      rationale.push("Maximum probing depth of 5 mm shifts stage to II.");
    }
    if (idx >= 2) {
      const ivFactors: string[] = [];
      if (c.masticatoryDysfunction) ivFactors.push("masticatory dysfunction / bite collapse / drifting");
      if (c.mobility >= 2) ivFactors.push(`secondary occlusal trauma (mobility grade ${c.mobility})`);
      if (c.teethPresent < 20) ivFactors.push(`<20 remaining teeth (${c.teethPresent})`);
      if (ivFactors.length) {
        if (idx < 3) rationale.push(`Stage IV complexity: ${ivFactors.join(", ")}.`);
        idx = 3;
      }
    }
    stage = STAGES[idx];

    // Grade
    let gIdx = 1;
    if (rbl > 0 && age > 0) {
      boneLossAgeRatio = round(rbl / age, 2);
      gIdx = boneLossAgeRatio < 0.25 ? 0 : boneLossAgeRatio <= 1 ? 1 : 2;
      rationale.push(`% bone loss / age = ${boneLossAgeRatio} → Grade ${["A", "B", "C"][gIdx]} (indirect evidence of progression).`);
    } else {
      rationale.push("No bone loss data for progression rate — Grade B assumed by default.");
    }
    if (smoking === "gte10") {
      if (gIdx < 2) rationale.push("Smoking ≥10 cigarettes/day modifies grade to C.");
      gIdx = 2;
    } else if (smoking === "lt10" && gIdx < 1) {
      gIdx = 1;
      rationale.push("Smoking <10 cigarettes/day modifies grade to at least B.");
    }
    grade = (["A", "B", "C"] as const)[gIdx];

    if (c.pattern === "molar-incisor") extent = "Molar/incisor pattern";
    else if (c.teethWithCALPercent > 0) extent = c.teethWithCALPercent < 30 ? "Localized" : "Generalized";
    else extent = c.pattern === "localized" ? "Localized" : "Generalized";
    diagnosis = `${extent} Periodontitis — Stage ${stage}, Grade ${grade}`;
  } else if (category === "gingivitis") {
    extent = c.bopPercent > 30 ? "Generalized" : "Localized";
    diagnosis = `${extent} plaque-induced gingivitis (intact periodontium)`;
  } else {
    diagnosis = "Clinical periodontal health (intact periodontium)";
  }

  // ---------- 5. Findings ----------
  findings.push(`Plaque Index ${c.plaqueIndex} · Gingival Index ${c.gingivalIndex} · BOP ${c.bopPercent}%`);
  findings.push(`Probing depth: mean ${c.meanPD} mm, max ${c.maxPD} mm · Max interdental CAL ${c.maxCAL} mm`);
  if (rbl > 0) findings.push(`Radiographic bone loss ${round(rbl)}% (${rblLocation} third) — source: ${rblSource === "ai" ? "AI estimate" : "clinician"}`);
  if (c.verticalDefect) findings.push("Vertical (angular) bony defect ≥3 mm present");
  if (c.furcation !== "none") findings.push(`Furcation involvement Class ${c.furcation}`);
  if (c.mobility > 0) findings.push(`Tooth mobility grade ${c.mobility}`);
  if (c.suppuration) findings.push("Suppuration on probing");
  if (c.recession) findings.push("Gingival recession present");
  if (photo) findings.push(`Photo analysis: inflammation ${round(photo.inflammationScore, 1)}/3, plaque ${round(photo.plaqueScore, 1)}/3`);
  if (smoking !== "none") findings.push(`Smoker (${smoking === "gte10" ? "≥10" : "<10"} cigarettes/day)`);

  // ---------- 6. Risk assessment (adapted from PRA, Lang & Tonetti 2003) ----------
  let risk =
    c.bopPercent * 0.3 +
    c.teethWithCALPercent * 0.12 +
    clamp(c.maxPD - 3, 0, 6) * 4 +
    c.teethLostPerio * 3 +
    (boneLossAgeRatio ?? rbl / Math.max(age, 18)) * 15 +
    c.plaqueIndex * 3 +
    (smoking === "gte10" ? 18 : smoking === "lt10" ? 9 : 0);
  risk = Math.round(clamp(risk, 2, 99));
  const riskLevel: AnalysisResult["riskLevel"] = risk < 35 ? "Low" : risk < 65 ? "Moderate" : "High";

  // ---------- 7. Confidence ----------
  const completeness =
    0.6 + (features?.photo ? 0.15 : 0) + (features?.radiograph || rblSource === "clinician" ? 0.25 : 0);
  const pChosen = probabilities[category];
  let confidence = 100 * (0.65 * pChosen + 0.35 * completeness) - warnings.length * 4;
  confidence = Math.round(clamp(confidence, 35, 98));

  // ---------- 8. Prognosis & recall ----------
  let prognosis = "Good";
  let recall = "12 months";
  if (category === "gingivitis") {
    prognosis = "Good (reversible with plaque control)";
    recall = "6 months";
  } else if (category === "periodontitis") {
    if (stage === "I" || stage === "II") prognosis = grade === "C" ? "Fair" : "Good";
    else if (stage === "III") prognosis = grade === "C" ? "Questionable" : "Fair";
    else prognosis = grade === "C" ? "Unfavourable" : "Questionable";
    recall = riskLevel === "High" || grade === "C" || stage === "IV" ? "3 months" : riskLevel === "Moderate" ? "3–4 months" : "6 months";
  }
  if (category === "health" && riskLevel !== "Low") recall = "6 months";

  const plan = buildPlan(category, stage, grade, c, smoking);

  return {
    category,
    diagnosis,
    stage,
    grade,
    extent,
    riskScore: risk,
    riskLevel,
    confidence,
    probabilities: {
      health: round(probabilities.health * 100, 1),
      gingivitis: round(probabilities.gingivitis * 100, 1),
      periodontitis: round(probabilities.periodontitis * 100, 1),
    },
    rblUsed: round(rbl, 1),
    rblSource,
    boneLossAgeRatio,
    prognosis,
    recall,
    findings,
    rationale,
    warnings,
    plan,
    engine: ENGINE_VERSION,
  };
}

function buildPlan(
  category: Category,
  stage: Stage | null,
  grade: "A" | "B" | "C" | null,
  c: ClinicalData,
  smoking: string,
): TreatmentPhase[] {
  const riskControl: string[] = [];
  if (smoking !== "none") riskControl.push("Smoking cessation counselling (brief intervention, 5A’s model) and referral");
  if (c.plaqueIndex >= 2) riskControl.push("Intensive plaque control motivation; target full-mouth plaque score <20%");

  if (category === "health") {
    return [
      {
        title: "Preventive Care",
        timing: "Today",
        items: [
          "Reinforce oral hygiene: modified Bass brushing twice daily with fluoride toothpaste",
          "Interdental cleaning with floss / interdental brushes",
          "Professional prophylaxis if supragingival deposits present",
          ...riskControl,
        ],
      },
      { title: "Maintenance", timing: "Recall 6–12 months", items: ["Periodic periodontal screening (BPE/PSR)", "Update radiographs as clinically indicated"] },
    ];
  }

  if (category === "gingivitis") {
    return [
      {
        title: "Phase I — Cause-related Therapy",
        timing: "Visit 1",
        items: [
          "Patient education on plaque-induced gingival inflammation",
          "Oral hygiene instructions (powered/manual brushing, interdental brushes)",
          "Supragingival scaling and polishing (professional mechanical plaque removal)",
          "Removal of plaque-retentive factors (overhanging restorations, calculus)",
          "Adjunctive 0.12–0.2% chlorhexidine mouthrinse for 2 weeks (optional)",
          ...riskControl,
        ],
      },
      { title: "Re-evaluation", timing: "4–6 weeks", items: ["Re-chart BOP and plaque scores", "Target BOP <10% for gingival health"] },
      { title: "Maintenance", timing: "Every 6 months", items: ["Supportive preventive care and OHI reinforcement"] },
    ];
  }

  // Periodontitis — EFP S3 step-wise approach
  const plan: TreatmentPhase[] = [
    {
      title: "Step 1 — Behaviour Change & Risk Control",
      timing: "Visit 1",
      items: [
        "Explain diagnosis, staging and grading; obtain treatment consent",
        "Individualised oral hygiene instructions and interdental cleaning aids",
        "Supragingival professional mechanical plaque removal",
        "Removal of plaque-retentive factors",
        ...riskControl,
      ],
    },
    {
      title: "Step 2 — Cause-related Therapy",
      timing: "Visits 2–4",
      items: [
        "Subgingival instrumentation (scaling & root planing) — quadrant-wise or full-mouth within 24 h",
        "Local anaesthesia as required; hand and ultrasonic instrumentation",
        ...(c.suppuration ? ["Manage suppurating sites; consider local antimicrobial adjuncts"] : []),
        ...(grade === "C" && (stage === "III" || stage === "IV")
          ? ["Consider adjunctive systemic antimicrobials (e.g. amoxicillin + metronidazole) for young patients with Grade C — clinician judgement"]
          : []),
      ],
    },
    {
      title: "Re-evaluation",
      timing: "6–8 weeks after Step 2",
      items: [
        "Full-mouth periodontal charting (PD, CAL, BOP)",
        "Endpoint: no PD ≥5 mm with BOP and no PD ≥6 mm",
        "Repeat instrumentation of residual pockets 4–5 mm with BOP",
      ],
    },
  ];

  if (stage === "III" || stage === "IV" || c.maxPD >= 6) {
    const surg = ["Access flap surgery for residual pockets ≥6 mm"];
    if (c.verticalDefect) surg.push("Regenerative therapy (EMD / bone graft ± barrier membrane) for intrabony defects ≥3 mm");
    if (c.furcation === "II") surg.push("Furcation Class II: regenerative therapy where feasible");
    if (c.furcation === "III") surg.push("Furcation Class III: tunnelling, root resection or extraction based on prognosis");
    surg.push("Resective / pocket-elimination surgery where regeneration not indicated");
    plan.push({ title: "Step 3 — Surgical / Corrective Therapy", timing: "After re-evaluation", items: surg });
  }

  if (stage === "IV") {
    plan.push({
      title: "Stage IV — Interdisciplinary Rehabilitation",
      timing: "After periodontal stabilisation",
      items: [
        "Occlusal therapy and splinting of mobile teeth (secondary occlusal trauma)",
        "Orthodontic therapy for pathological tooth migration / flaring",
        "Prosthetic rehabilitation (FPD, RPD or implant-supported) to restore masticatory function",
        "Ridge preservation / augmentation where required",
        "Strategic extraction of hopeless teeth",
      ],
    });
  } else if (c.mobility >= 2) {
    plan.push({ title: "Occlusal Management", timing: "As indicated", items: ["Occlusal adjustment and splinting of mobile teeth"] });
  }

  plan.push({
    title: "Step 4 — Supportive Periodontal Care",
    timing: grade === "C" || stage === "IV" ? "Every 3 months" : "Every 3–6 months",
    items: [
      "Re-charting, supra- and subgingival PMPR",
      "Reinforcement of oral hygiene and risk-factor control",
      "Radiographic monitoring of bone levels (periodic)",
    ],
  });

  return plan;
}
