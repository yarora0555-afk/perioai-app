import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { evaluateEligibility } from "@/lib/criteria";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const name = String(b.name ?? "").trim();
    const age = Number(b.age);
    const teethCount = Number(b.teethCount);
    if (!name) return NextResponse.json({ error: "Patient name is required" }, { status: 400 });
    if (!Number.isFinite(age) || age < 1 || age > 120) return NextResponse.json({ error: "Valid age is required" }, { status: 400 });
    if (!Number.isFinite(teethCount) || teethCount < 0 || teethCount > 32)
      return NextResponse.json({ error: "Valid number of teeth is required" }, { status: 400 });

    const inclusion = (b.inclusion ?? {}) as Record<string, boolean>;
    const exclusion = (b.exclusion ?? {}) as Record<string, boolean>;
    const { eligible } = evaluateEligibility(inclusion, exclusion);
    const consentSigned = Boolean(b.consentSignature);

    const [row] = await db
      .insert(patients)
      .values({
        code: "PENDING",
        name,
        age,
        sex: String(b.sex ?? "Other"),
        phone: b.phone ? String(b.phone) : null,
        teethCount,
        smoking: ["none", "lt10", "gte10"].includes(b.smoking) ? b.smoking : "none",
        chiefComplaint: b.chiefComplaint ? String(b.chiefComplaint) : null,
        inclusion,
        exclusion,
        eligible: eligible && consentSigned,
        consentSigned,
        consentSignature: consentSigned ? String(b.consentSignature) : null,
        examiner: b.examiner ? String(b.examiner) : null,
      })
      .returning({ id: patients.id });

    const code = `PA-${new Date().getFullYear()}-${String(row.id).padStart(4, "0")}`;
    await db.update(patients).set({ code }).where(eq(patients.id, row.id));
    return NextResponse.json({ id: row.id, code, eligible: eligible && consentSigned });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 });
  }
}
