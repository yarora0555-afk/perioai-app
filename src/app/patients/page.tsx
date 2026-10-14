import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { patients } from "@/db/schema";
import Header from "@/components/Header";
import PatientList from "./PatientList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Patients" };

export default async function PatientsPage() {
  const rows = await db
    .select({
      id: patients.id,
      code: patients.code,
      name: patients.name,
      age: patients.age,
      sex: patients.sex,
      eligible: patients.eligible,
      createdAt: patients.createdAt,
      lastCategory: sql<string | null>`(select ai_category from assessments a where a.patient_id = ${patients.id} order by a.created_at desc limit 1)`,
      lastStage: sql<string | null>`(select ai_stage from assessments a where a.patient_id = ${patients.id} order by a.created_at desc limit 1)`,
      visits: sql<number>`(select count(*)::int from assessments a where a.patient_id = ${patients.id})`,
    })
    .from(patients)
    .orderBy(desc(patients.createdAt));

  return (
    <div>
      <Header title="Patients" subtitle={`${rows.length} enrolled`} />
      <PatientList rows={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} />
    </div>
  );
}
