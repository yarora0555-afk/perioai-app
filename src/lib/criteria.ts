export interface Criterion {
  id: string;
  label: string;
  hint?: string;
}

export const INCLUSION: Criterion[] = [
  { id: "age", label: "Patient aged between 18–65 years", hint: "Verify with ID / date of birth" },
  { id: "diagnosis", label: "Diagnosed with gingivitis or periodontitis", hint: "Provisional clinical diagnosis" },
  { id: "teeth", label: "At least 20 natural teeth present", hint: "Exclude third molars if partially erupted" },
  { id: "exam", label: "Willing to undergo clinical and radiographic examination" },
  { id: "consent", label: "Provides written informed consent" },
  { id: "cooperative", label: "Cooperative for periodontal examination and data recording" },
];

export const EXCLUSION: Criterion[] = [
  { id: "systemic", label: "Systemic disease affecting periodontal health", hint: "e.g. diabetes, immunodeficiency, blood dyscrasias" },
  { id: "therapy", label: "Periodontal therapy received within the last 6 months" },
  { id: "drugs", label: "Antibiotics / anti-inflammatory drugs within the previous 3 months" },
  { id: "pregnant", label: "Pregnant or lactating women" },
  { id: "radiograph", label: "Poor-quality or incomplete radiographic records" },
  { id: "uncooperative", label: "Uncooperative or unwilling to participate in the study" },
];

export function evaluateEligibility(
  inclusion: Record<string, boolean>,
  exclusion: Record<string, boolean>,
) {
  const missingInclusion = INCLUSION.filter((c) => !inclusion[c.id]);
  const presentExclusion = EXCLUSION.filter((c) => exclusion[c.id]);
  return {
    eligible: missingInclusion.length === 0 && presentExclusion.length === 0,
    missingInclusion,
    presentExclusion,
  };
}

export const CATEGORY_LABEL: Record<string, string> = {
  health: "Periodontal Health",
  gingivitis: "Gingivitis",
  periodontitis: "Periodontitis",
};
