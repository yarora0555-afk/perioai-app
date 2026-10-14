export type Smoking = "none" | "lt10" | "gte10";

export interface ClinicalData {
  teethPresent: number;
  teethLostPerio: number;
  plaqueIndex: number; // Silness & Löe 0-3
  gingivalIndex: number; // Löe & Silness 0-3
  bopPercent: number; // 0-100
  meanPD: number; // mm
  maxPD: number; // mm
  maxCAL: number; // interdental CAL at site of greatest loss, mm
  teethWithCALPercent: number; // % teeth with CAL/PD>=4 (extent)
  rblPercent: number | null; // radiographic bone loss % (worst site), null => AI estimate
  rblLocation: "none" | "coronal" | "middle" | "apical";
  verticalDefect: boolean; // vertical bone loss >= 3mm
  furcation: "none" | "I" | "II" | "III";
  mobility: 0 | 1 | 2 | 3;
  recession: boolean;
  suppuration: boolean;
  masticatoryDysfunction: boolean; // bite collapse, drifting, flaring, secondary occlusal trauma
  pattern: "generalized" | "localized" | "molar-incisor";
}

export interface ImageFeatures {
  photo?: {
    gingivaCoverage: number; // fraction of pixels classified as gingiva
    rednessIndex: number; // 0..1
    inflammationScore: number; // 0..3 (GI-like)
    plaqueScore: number; // 0..3
    brightness: number;
    sharpness: number;
    quality: "good" | "acceptable" | "poor";
  };
  radiograph?: {
    contrast: number;
    sharpness: number;
    brightness: number;
    estimatedRBL: number; // %
    quality: "good" | "acceptable" | "poor";
  };
}

export type Category = "health" | "gingivitis" | "periodontitis";

export interface TreatmentPhase {
  title: string;
  timing: string;
  items: string[];
}

export interface AnalysisResult {
  category: Category;
  diagnosis: string;
  stage: "I" | "II" | "III" | "IV" | null;
  grade: "A" | "B" | "C" | null;
  extent: string | null;
  riskScore: number; // 0-100
  riskLevel: "Low" | "Moderate" | "High";
  confidence: number; // 0-100
  probabilities: { health: number; gingivitis: number; periodontitis: number };
  rblUsed: number;
  rblSource: "clinician" | "ai" | "none";
  boneLossAgeRatio: number | null;
  prognosis: string;
  recall: string;
  findings: string[];
  rationale: string[];
  warnings: string[];
  plan: TreatmentPhase[];
  engine: string;
}

export const defaultClinical: ClinicalData = {
  teethPresent: 28,
  teethLostPerio: 0,
  plaqueIndex: 1,
  gingivalIndex: 1,
  bopPercent: 20,
  meanPD: 2.5,
  maxPD: 4,
  maxCAL: 0,
  teethWithCALPercent: 0,
  rblPercent: null,
  rblLocation: "none",
  verticalDefect: false,
  furcation: "none",
  mobility: 0,
  recession: false,
  suppuration: false,
  masticatoryDysfunction: false,
  pattern: "generalized",
};
