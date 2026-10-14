import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assessments, patients } from "@/db/schema";
import { analyze } from "@/lib/engine";
import type { AnalysisResult, ClinicalData, ImageFeatures } from "@/lib/types";

export const maxDuration = 60;

/**
 * Optional: forward to an external Python/TensorFlow inference service.
 * Set AI_MODEL_URL (and optionally AI_MODEL_KEY) to enable. The service receives
 * { clinical, imageFeatures, photo, radiograph, age, smoking } and may return a partial
 * AnalysisResult that overrides the on-device engine output.
 */
async function externalModel(payload: unknown): Promise<Partial<AnalysisResult> | null> {
  const url = process.env.AI_MODEL_URL;
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.AI_MODEL_KEY ? { Authorization: `Bearer ${process.env.AI_MODEL_KEY}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    return (await res.json()) as Partial<AnalysisResult>;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const patientId = Number(b.patientId);
    const [patient] = await db.select().from(patients).where(eq(patients.id, patientId));
    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

    const clinical = b.clinical as ClinicalData;
    if (!clinical || typeof clinical.bopPercent !== "number")
      return NextResponse.json({ error: "Clinical data missing" }, { status: 400 });
    const features = (b.imageFeatures ?? null) as ImageFeatures | null;

    let result = analyze({ clinical, features, age: patient.age, smoking: patient.smoking });
    const ext = await externalModel({
      clinical,
      imageFeatures: features,
      photo: b.photo ?? null,
      radiograph: b.radiograph ?? null,
      age: patient.age,
      smoking: patient.smoking,
    });
    if (ext) result = { ...result, ...ext };

    const [row] = await db
      .insert(assessments)
      .values({
        patientId,
        clinical,
        photo: typeof b.photo === "string" ? b.photo : null,
        radiograph: typeof b.radiograph === "string" ? b.radiograph : null,
        imageFeatures: features,
        result,
        aiCategory: result.category,
        aiStage: result.stage,
        notes: b.notes ? String(b.notes) : null,
      })
      .returning({ id: assessments.id });

    return NextResponse.json({ id: row.id, result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
