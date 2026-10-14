import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assessments, patients } from "@/db/schema";
import type { AnalysisResult, ClinicalData } from "@/lib/types";

export const dynamic = "force-dynamic";

const esc = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET() {
  const rows = await db
    .select({ a: assessments, p: patients })
    .from(assessments)
    .innerJoin(patients, eq(assessments.patientId, patients.id))
    .orderBy(desc(assessments.createdAt));

  const header = [
    "assessment_id", "date", "patient_code", "age", "sex", "smoking", "teeth_present", "eligible",
    "PI", "GI", "BOP_pct", "mean_PD", "max_PD", "max_CAL", "teeth_CAL_pct", "RBL_pct", "RBL_source",
    "furcation", "mobility", "vertical_defect", "teeth_lost_perio",
    "ai_category", "ai_stage", "ai_grade", "ai_extent", "ai_confidence", "risk_score", "risk_level",
    "clinician_category", "clinician_stage", "agreement",
  ];
  const lines = [header.join(",")];
  for (const { a, p } of rows) {
    const c = a.clinical as ClinicalData;
    const r = a.result as AnalysisResult;
    lines.push(
      [
        a.id, a.createdAt.toISOString(), p.code, p.age, p.sex, p.smoking, c.teethPresent, p.eligible,
        c.plaqueIndex, c.gingivalIndex, c.bopPercent, c.meanPD, c.maxPD, c.maxCAL, c.teethWithCALPercent, r.rblUsed, r.rblSource,
        c.furcation, c.mobility, c.verticalDefect, c.teethLostPerio,
        r.category, r.stage ?? "", r.grade ?? "", r.extent ?? "", r.confidence, r.riskScore, r.riskLevel,
        a.clinicianCategory ?? "", a.clinicianStage ?? "",
        a.clinicianCategory ? (a.clinicianCategory === a.aiCategory ? "yes" : "no") : "",
      ].map(esc).join(","),
    );
  }
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="perioai-study-data-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
