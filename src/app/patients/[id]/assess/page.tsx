import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { patients } from "@/db/schema";
import AssessWizard from "./AssessWizard";

export const dynamic = "force-dynamic";

export default async function AssessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) notFound();
  const [p] = await db
    .select({ id: patients.id, name: patients.name, code: patients.code, age: patients.age, teethCount: patients.teethCount, smoking: patients.smoking, eligible: patients.eligible })
    .from(patients)
    .where(eq(patients.id, pid));
  if (!p) notFound();
  return <AssessWizard patient={p} />;
}
