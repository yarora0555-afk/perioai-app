import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { AlertTriangle, CalendarClock, ClipboardList, Gauge, Lightbulb, Microscope, ShieldAlert, Stethoscope, TrendingUp } from "lucide-react";
import { db } from "@/db";
import { assessments, patients } from "@/db/schema";
import Header from "@/components/Header";
import DeleteButton from "@/components/DeleteButton";
import { CAT_COLOR, Ring, SectionTitle, fmtDate } from "@/components/ui";
import { LogoMark } from "@/components/Logo";
import type { AnalysisResult, ImageFeatures } from "@/lib/types";
import { ClinicianValidation, PrintShare } from "./ReportActions";

export const dynamic = "force-dynamic";

const HERO: Record<string, string> = {
  health: "from-emerald-500 to-teal-700",
  gingivitis: "from-amber-500 to-orange-600",
  periodontitis: "from-rose-500 to-fuchsia-700",
};

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const aid = Number(id);
  if (!Number.isFinite(aid)) notFound();
  const [row] = await db.select({ a: assessments, p: patients }).from(assessments).innerJoin(patients, eq(assessments.patientId, patients.id)).where(eq(assessments.id, aid));
  if (!row) notFound();
  const { a, p } = row;
  const r = a.result as AnalysisResult;
  const f = (a.imageFeatures ?? {}) as ImageFeatures;
  const riskColor = r.riskLevel === "Low" ? "#10b981" : r.riskLevel === "Moderate" ? "#f59e0b" : "#f43f5e";

  return (
    <div>
      <Header title="AI Report" subtitle={`${p.name} · ${fmtDate(a.createdAt)}`} back={`/patients/${p.id}`} />

      <div className="space-y-3 px-4 pt-4">
        {/* Print header */}
        <div className="hidden items-center gap-3 border-b pb-3 print:flex">
          <LogoMark size={40} />
          <div>
            <p className="text-lg font-extrabold">PerioAI: Periodontal Evaluation Report</p>
            <p className="text-xs text-slate-500">
              {p.name} · {p.code} · {p.age}y {p.sex} · {fmtDate(a.createdAt)}
            </p>
          </div>
        </div>

        <div className={`animate-scale-in relative overflow-hidden rounded-3xl bg-gradient-to-br ${HERO[r.category]} p-5 text-white shadow-xl`}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -left-6 h-40 w-40 rounded-full bg-white/10" />
          <p className="relative text-[11px] font-bold uppercase tracking-widest text-white/80">AI Diagnosis</p>
          <h2 className="relative mt-1 text-[22px] font-extrabold leading-tight">{r.diagnosis}</h2>
          <div className="relative mt-4 grid grid-cols-3 gap-2">
            {[
              ["Stage", r.stage ?? "—"],
              ["Grade", r.grade ?? "—"],
              ["Extent", r.extent ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white/15 p-2.5 text-center ring-1 ring-white/20 backdrop-blur">
                <p className="truncate text-base font-extrabold">{v}</p>
                <p className="text-[10px] font-semibold uppercase text-white/75">{k}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card flex flex-col items-center p-4">
            <Ring value={r.confidence} label="confidence" />
            <p className="mt-2 text-xs font-semibold text-slate-500">AI confidence</p>
          </div>
          <div className="card flex flex-col items-center p-4">
            <Ring value={r.riskScore} color={riskColor} label="risk" />
            <p className="mt-2 text-xs font-semibold" style={{ color: riskColor }}>
              {r.riskLevel} risk
            </p>
          </div>
        </div>

        <div className="card p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
            <Gauge className="h-4 w-4 text-brand-600" /> Class probabilities
          </p>
          {(["health", "gingivitis", "periodontitis"] as const).map((k) => (
            <div key={k} className="mb-2.5 last:mb-0">
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold capitalize text-slate-600">{k === "health" ? "Healthy" : k}</span>
                <span className="font-bold text-ink">{r.probabilities[k]}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="animate-[progress_1.2s_ease_both] h-full rounded-full" style={{ width: `${r.probabilities[k]}%`, maxWidth: `${r.probabilities[k]}%`, background: CAT_COLOR[k] }} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <TrendingUp className="h-5 w-5 text-brand-600" />
            <p className="mt-2 text-[11px] font-semibold uppercase text-slate-400">Prognosis</p>
            <p className="text-sm font-bold text-ink">{r.prognosis}</p>
          </div>
          <div className="card p-4">
            <CalendarClock className="h-5 w-5 text-brand-600" />
            <p className="mt-2 text-[11px] font-semibold uppercase text-slate-400">Recall</p>
            <p className="text-sm font-bold text-ink">{r.recall}</p>
          </div>
        </div>

        {r.warnings.length > 0 && (
          <div className="card space-y-2 bg-amber-50 p-4 ring-amber-200">
            <p className="flex items-center gap-2 text-sm font-bold text-amber-800">
              <AlertTriangle className="h-4 w-4" /> Attention
            </p>
            {r.warnings.map((w) => (
              <p key={w} className="text-xs text-amber-800">
                • {w}
              </p>
            ))}
          </div>
        )}

        <SectionTitle>
          <span className="flex items-center gap-2">
            <Microscope className="h-4 w-4 text-brand-600" /> Clinical findings
          </span>
        </SectionTitle>
        <ul className="card stagger divide-y divide-slate-100 px-4">
          {r.findings.map((x) => (
            <li key={x} className="py-2.5 text-[13px] text-slate-700">
              {x}
            </li>
          ))}
        </ul>

        <SectionTitle>
          <span className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-brand-600" /> Why this diagnosis
          </span>
        </SectionTitle>
        <ol className="card space-y-2.5 p-4">
          {r.rationale.map((x, i) => (
            <li key={x} className="flex gap-3 text-[13px] text-slate-700">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">{i + 1}</span>
              {x}
            </li>
          ))}
        </ol>

        {(a.photo || a.radiograph) && (
          <>
            <SectionTitle>Images analysed</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {a.photo && (
                <figure className="card overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.photo} alt="Intraoral photograph" className="aspect-square w-full object-cover" />
                  <figcaption className="p-2.5 text-[11px] text-slate-500">
                    Photo · Inflammation {f.photo?.inflammationScore?.toFixed(1) ?? "—"}/3 · {f.photo?.quality ?? ""}
                  </figcaption>
                </figure>
              )}
              {a.radiograph && (
                <figure className="card overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.radiograph} alt="Radiograph" className="aspect-square w-full bg-black object-contain" />
                  <figcaption className="p-2.5 text-[11px] text-slate-500">
                    Radiograph · Est. RBL {f.radiograph?.estimatedRBL ?? "—"}% · {f.radiograph?.quality ?? ""}
                  </figcaption>
                </figure>
              )}
            </div>
          </>
        )}

        <SectionTitle>
          <span className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-brand-600" /> Treatment plan
          </span>
        </SectionTitle>
        <ol className="stagger relative space-y-3 border-l-2 border-dashed border-brand-200 pl-6">
          {r.plan.map((ph, i) => (
            <li key={ph.title} className="relative">
              <span className="absolute -left-[37px] top-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white ring-4 ring-slate-50">{i + 1}</span>
              <div className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-ink">{ph.title}</p>
                  <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">{ph.timing}</span>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {ph.items.map((it) => (
                    <li key={it} className="flex gap-2 text-[12.5px] leading-snug text-slate-600">
                      <Stethoscope className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>

        {a.notes && (
          <div className="card p-4">
            <p className="text-[11px] font-semibold uppercase text-slate-400">Clinical notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{a.notes}</p>
          </div>
        )}

        <div className="pt-3">
          <ClinicianValidation id={a.id} initialCat={a.clinicianCategory} initialStage={a.clinicianStage} aiCat={a.aiCategory} aiStage={a.aiStage} />
        </div>

        <PrintShare title={`PerioAI report – ${p.name}`} />

        <p className="flex items-start gap-2 rounded-xl bg-slate-100 p-3 text-[11px] leading-relaxed text-slate-500">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          This AI-generated report supports clinical decisions and is not a definitive diagnosis. Final diagnosis and treatment are the responsibility of the treating periodontist. {r.engine}
        </p>

        <div className="no-print flex gap-2.5 pb-4">
          <Link href={`/patients/${p.id}/assess`} className="btn-primary flex-1 !py-3 text-sm">
            Re-assess
          </Link>
          <div className="flex-1">
            <DeleteButton url={`/api/assessments/${a.id}`} redirect={`/patients/${p.id}`} label="Delete" confirmText="Delete this assessment?" />
          </div>
        </div>
      </div>
    </div>
  );
}
