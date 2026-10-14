import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assessments } from "@/db/schema";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const b = await req.json();
  const cat = b.clinicianCategory;
  if (cat && !["health", "gingivitis", "periodontitis"].includes(cat))
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  const stage = b.clinicianStage && ["I", "II", "III", "IV"].includes(b.clinicianStage) ? b.clinicianStage : null;
  await db
    .update(assessments)
    .set({
      clinicianCategory: cat || null,
      clinicianStage: cat === "periodontitis" ? stage : null,
      ...(typeof b.notes === "string" ? { notes: b.notes } : {}),
    })
    .where(eq(assessments.id, Number(id)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await db.delete(assessments).where(eq(assessments.id, Number(id)));
  return NextResponse.json({ ok: true });
}
