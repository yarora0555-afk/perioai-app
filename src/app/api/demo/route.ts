import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assessments, patients } from "@/db/schema";
import { INCLUSION, EXCLUSION } from "@/lib/criteria";
import { analyze } from "@/lib/engine";
import { defaultClinical, type ClinicalData } from "@/lib/types";

type Seed = {
  name: string;
  age: number;
  sex: string;
  smoking: "none" | "lt10" | "gte10";
  teeth: number;
  c: Partial<ClinicalData>;
  truth: "health" | "gingivitis" | "periodontitis";
  truthStage?: "I" | "II" | "III" | "IV";
};

const SEEDS: Seed[] = [
  { name: "Aarav Sharma", age: 24, sex: "Male", smoking: "none", teeth: 30, truth: "gingivitis", c: { bopPercent: 38, gingivalIndex: 2, plaqueIndex: 2, maxPD: 4, meanPD: 2.8 } },
  { name: "Priya Nair", age: 31, sex: "Female", smoking: "none", teeth: 28, truth: "gingivitis", c: { bopPercent: 22, gingivalIndex: 1, plaqueIndex: 1, maxPD: 3, meanPD: 2.3 } },
  { name: "Rahul Verma", age: 45, sex: "Male", smoking: "gte10", teeth: 26, truth: "periodontitis", truthStage: "III", c: { bopPercent: 55, gingivalIndex: 2, plaqueIndex: 2, maxPD: 7, meanPD: 4.2, maxCAL: 6, teethWithCALPercent: 45, rblPercent: 40, rblLocation: "middle", verticalDefect: true, furcation: "II", mobility: 1 } },
  { name: "Sneha Iyer", age: 38, sex: "Female", smoking: "none", teeth: 28, truth: "periodontitis", truthStage: "II", c: { bopPercent: 32, gingivalIndex: 2, plaqueIndex: 2, maxPD: 5, meanPD: 3.4, maxCAL: 4, teethWithCALPercent: 35, rblPercent: 22, rblLocation: "coronal" } },
  { name: "Mohammed Khan", age: 58, sex: "Male", smoking: "lt10", teeth: 21, truth: "periodontitis", truthStage: "IV", c: { bopPercent: 60, gingivalIndex: 3, plaqueIndex: 3, maxPD: 8, meanPD: 4.9, maxCAL: 8, teethWithCALPercent: 70, rblPercent: 60, rblLocation: "middle", teethLostPerio: 5, mobility: 2, masticatoryDysfunction: true, furcation: "III", suppuration: true } },
  { name: "Ananya Reddy", age: 27, sex: "Female", smoking: "none", teeth: 30, truth: "health", c: { bopPercent: 6, gingivalIndex: 0, plaqueIndex: 1, maxPD: 3, meanPD: 2.0 } },
  { name: "Vikram Singh", age: 52, sex: "Male", smoking: "none", teeth: 27, truth: "periodontitis", truthStage: "I", c: { bopPercent: 28, gingivalIndex: 1, plaqueIndex: 2, maxPD: 4, meanPD: 2.9, maxCAL: 2, teethWithCALPercent: 20, rblPercent: 10, rblLocation: "coronal", pattern: "localized" } },
  { name: "Kavya Menon", age: 34, sex: "Female", smoking: "none", teeth: 29, truth: "periodontitis", truthStage: "II", c: { bopPercent: 18, gingivalIndex: 1, plaqueIndex: 1, maxPD: 4, meanPD: 2.7, maxCAL: 1, teethWithCALPercent: 10, rblPercent: null } },
  { name: "Arjun Patel", age: 41, sex: "Male", smoking: "gte10", teeth: 25, truth: "periodontitis", truthStage: "III", c: { bopPercent: 48, gingivalIndex: 2, plaqueIndex: 2, maxPD: 6, meanPD: 3.9, maxCAL: 5, teethWithCALPercent: 50, rblPercent: 38, rblLocation: "middle" } },
  { name: "Meera Joshi", age: 29, sex: "Female", smoking: "none", teeth: 30, truth: "gingivitis", c: { bopPercent: 12, gingivalIndex: 1, plaqueIndex: 1, maxPD: 3, meanPD: 2.2, maxCAL: 0 } },
];

export async function POST() {
  const allTrue = (list: { id: string }[], v: boolean) => Object.fromEntries(list.map((c) => [c.id, v]));
  let created = 0;
  for (const s of SEEDS) {
    const [p] = await db
      .insert(patients)
      .values({
        code: "PENDING",
        name: s.name,
        age: s.age,
        sex: s.sex,
        teethCount: s.teeth,
        smoking: s.smoking,
        chiefComplaint: "Bleeding gums while brushing",
        inclusion: allTrue(INCLUSION, true),
        exclusion: allTrue(EXCLUSION, false),
        eligible: true,
        consentSigned: true,
        examiner: "Demo Examiner",
      })
      .returning({ id: patients.id });
    await db
      .update(patients)
      .set({ code: `PA-${new Date().getFullYear()}-${String(p.id).padStart(4, "0")}` })
      .where(eq(patients.id, p.id));
    const clinical: ClinicalData = { ...defaultClinical, teethPresent: s.teeth, ...s.c };
    const result = analyze({ clinical, features: null, age: s.age, smoking: s.smoking });
    await db.insert(assessments).values({
      patientId: p.id,
      clinical,
      result,
      aiCategory: result.category,
      aiStage: result.stage,
      clinicianCategory: s.truth,
      clinicianStage: s.truthStage ?? null,
    });
    created++;
  }
  return NextResponse.json({ created });
}
