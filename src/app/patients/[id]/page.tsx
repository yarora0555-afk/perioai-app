import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { CheckCircle2, ChevronDown, ChevronRight, Cigarette, FileSignature, Phone, ScanLine, Smile, XCircle } from "lucide-react";
import { db } from "@/db";
import { assessments, patients } from "@/db/schema";
import Header from "@/components/Header";
import DeleteButton from "@/components/DeleteButton";
import { Avatar, CategoryBadge, SectionTitle, fmtDate } from "@/components/ui";
import { EXCLUSION, INCLUSION } from "@/lib/criteria";
import type { AnalysisResult } from "@/lib/types";

export const dynamic = "force-dynamic";

const SMOKE: Record<string, string> = { none: "Non-smoker", lt10: "<10 cig/day", gte10: "≥10 cig/day" };

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) notFound();
  const [p] = await db.select().from(patients).where(eq(patients.id, pid));
  if (!p) notFound();
  const list = await db
    .select({ id: assessments.id, createdAt: assessments.createdAt, result: assessments.result, clinicianCategory: assessments.clinicianCategory })
    .from(assessments)
    .where(eq(assessments.patientId, pid))
    .orderBy(desc(assessments.createdAt));

  return (
    <div>
      <Header title={p.name} subtitle={p.code} back="/patients" />
      <div className="px-4 pt-4">
        <div className="card animate-fade-up overflow-hidden">
          <div className="brand-gradient flex items-center gap-3 p-4 text-white">
            <Avatar name={p.name} />
            <div className="flex-1">
              <p className="text-lg font-bold">{p.name}</p>
              <p className="text-xs text-cyan-100">
                {p.age} years · {p.sex} · Enrolled {fmtDate(p.createdAt)}
              </p>
            </div>
            {p.eligible ? (
              <span className="rounded-full bg-emerald-400/25 px-2.5 py-1 text-[11px] font-bold ring-1 ring-emerald-200/50">Eligible</span>
            ) : (
              <span className="rounded-full bg-rose-400/25 px-2.5 py-1 text-[11px] font-bold ring-1 ring-rose-200/50">Not eligible</span>
            )}
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-100 py-3 text-center">
            <div>
              <Smile className="mx-auto h-4 w-4 text-brand-600" />
              <p className="mt-1 text-sm font-bold text-ink">{p.teethCount}</p>
              <p className="text-[10px] text-slate-400">Teeth</p>
            </div>
            <div>
              <Cigarette className="mx-auto h-4 w-4 text-brand-600" />
              <p className="mt-1 text-sm font-bold text-ink">{SMOKE[p.smoking]}</p>
              <p className="text-[10px] text-slate-400">Smoking</p>
            </div>
            <div>
              <Phone className="mx-auto h-4 w-4 text-brand-600" />
              <p className="mt-1 truncate px-1 text-sm font-bold text-ink">{p.phone || "—"}</p>
              <p className="text-[10px] text-slate-400">Contact</p>
            </div>
          </div>
          {p.chiefComplaint && (
            <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              <b className="text-slate-700">Chief complaint:</b> {p.chiefComplaint}
            </p>
          )}
        </div>

        <Link href={`/patients/${p.id}/assess`} className="btn-primary mt-4 w-full">
          <ScanLine className="h-5 w-5" /> New AI Assessment
        </Link>

        <SectionTitle>Eligibility screening</SectionTitle>
        <details className="card group overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-bold text-ink">
            Inclusion &amp; exclusion checklist
            <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-4 px-4 pb-4">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-emerald-600">Inclusion</p>
              <ul className="space-y-1.5">
                {INCLUSION.map((c) => (
                  <li key={c.id} className="flex items-start gap-2 text-xs text-slate-600">
                    {p.inclusion[c.id] ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <XCircle className="h-4 w-4 shrink-0 text-rose-500" />}
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-rose-600">Exclusion</p>
              <ul className="space-y-1.5">
                {EXCLUSION.map((c) => (
                  <li key={c.id} className="flex items-start gap-2 text-xs text-slate-600">
                    {p.exclusion[c.id] ? <XCircle className="h-4 w-4 shrink-0 text-rose-500" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                    {c.label} — <b>{p.exclusion[c.id] ? "Yes" : "No"}</b>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
        <div className="card mt-2.5 flex items-center gap-3 p-4">
          <FileSignature className={`h-6 w-6 ${p.consentSigned ? "text-emerald-600" : "text-slate-400"}`} />
          <div className="flex-1">
            <p className="text-sm font-bold text-ink">Informed consent</p>
            <p className="text-xs text-slate-500">{p.consentSigned ? `Signed digitally${p.examiner ? ` · Examiner: ${p.examiner}` : ""}` : "Not signed"}</p>
          </div>
          {p.consentSignature && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.consentSignature} alt="Signature" className="h-10 w-24 rounded-lg bg-slate-50 object-contain ring-1 ring-slate-200" />
          )}
        </div>

        <SectionTitle>Assessment history ({list.length})</SectionTitle>
        {list.length === 0 ? (
          <p className="card p-6 text-center text-sm text-slate-500">No assessments recorded yet.</p>
        ) : (
          <ol className="stagger relative space-y-3 border-l-2 border-brand-100 pl-5">
            {list.map((a) => {
              const r = a.result as AnalysisResult;
              return (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[27px] top-4 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-brand-100" />
                  <Link href={`/reports/${a.id}`} className="card flex items-center gap-3 p-3.5 transition active:scale-[0.98]">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-slate-400">{fmtDate(a.createdAt)}</p>
                      <p className="mt-0.5 truncate text-sm font-bold text-ink">{r.diagnosis}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <CategoryBadge cat={r.category} stage={r.stage} grade={r.grade} />
                        <span className="text-[11px] text-slate-400">Risk {r.riskLevel}</span>
                        {a.clinicianCategory && <span className="text-[11px] font-semibold text-brand-600">✓ Validated</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300" />
                  </Link>
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-8">
          <DeleteButton url={`/api/patients/${p.id}`} redirect="/patients" label="Delete patient record" confirmText="Delete this patient and all assessments? This cannot be undone." />
        </div>
      </div>
    </div>
  );
}
