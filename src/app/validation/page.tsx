import Link from "next/link";
import { isNotNull } from "drizzle-orm";
import { Activity, Download, FlaskConical, Info } from "lucide-react";
import { db } from "@/db";
import { assessments } from "@/db/schema";
import Header from "@/components/Header";
import { Ring, SectionTitle } from "@/components/ui";
import { CATS, computeMetrics, kappaLabel } from "@/lib/metrics";

export const dynamic = "force-dynamic";
export const metadata = { title: "Diagnostic Accuracy" };

const pct = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);
const SHORT: Record<string, string> = { health: "Healthy", gingivitis: "Gingiv.", periodontitis: "Perio." };

export default async function ValidationPage() {
  const rows = await db
    .select({ ai: assessments.aiCategory, truth: assessments.clinicianCategory, aiStage: assessments.aiStage, truthStage: assessments.clinicianStage })
    .from(assessments)
    .where(isNotNull(assessments.clinicianCategory));
  const m = computeMetrics(rows.map((r) => ({ ai: r.ai, truth: r.truth!, aiStage: r.aiStage, truthStage: r.truthStage })));
  const maxCell = Math.max(1, ...m.matrix.flat());

  return (
    <div>
      <Header
        title="Diagnostic Accuracy"
        subtitle="AI vs clinician gold standard"
        right={
          <a href="/api/export" className="flex h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-xs font-bold text-white shadow-md shadow-brand-600/30">
            <Download className="h-4 w-4" /> CSV
          </a>
        }
      />
      <div className="px-4 pt-4">
        {m.n === 0 ? (
          <div className="card flex flex-col items-center p-8 text-center">
            <div className="animate-float flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-500">
              <FlaskConical className="h-8 w-8" />
            </div>
            <p className="mt-4 font-bold text-ink">No validated cases yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Open an AI report and record the clinician&apos;s gold-standard diagnosis. Sensitivity, specificity, accuracy and Cohen&apos;s κ will appear here.
            </p>
            <Link href="/more" className="btn-ghost mt-5 text-sm">
              Load demo dataset in Settings
            </Link>
          </div>
        ) : (
          <>
            <div className="card animate-fade-up flex items-center gap-4 p-4">
              <Ring value={m.accuracy * 100} size={96} label="accuracy" />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase text-slate-400">Overall (3-class)</p>
                <p className="text-2xl font-extrabold text-ink">κ = {m.kappa.toFixed(2)}</p>
                <p className="text-xs font-semibold text-brand-600">{kappaLabel(m.kappa)} agreement</p>
                <p className="mt-1 text-[11px] text-slate-400">n = {m.n} validated assessments</p>
              </div>
            </div>

            <SectionTitle>Periodontitis detection (binary)</SectionTitle>
            <div className="stagger grid grid-cols-2 gap-3">
              {[
                ["Sensitivity", m.binary.sensitivity, "True positive rate"],
                ["Specificity", m.binary.specificity, "True negative rate"],
                ["PPV", m.binary.ppv, "Positive predictive value"],
                ["NPV", m.binary.npv, "Negative predictive value"],
              ].map(([k, v, s]) => (
                <div key={k as string} className="card p-4">
                  <p className="text-[11px] font-semibold uppercase text-slate-400">{k as string}</p>
                  <p className="text-2xl font-extrabold text-ink">{pct(v as number | null)}</p>
                  <p className="text-[10px] text-slate-400">{s as string}</p>
                </div>
              ))}
            </div>
            <div className="card mt-3 grid grid-cols-4 gap-2 p-3 text-center text-xs">
              {[
                ["TP", m.binary.tp, "text-emerald-600"],
                ["FN", m.binary.fn, "text-rose-600"],
                ["FP", m.binary.fp, "text-rose-600"],
                ["TN", m.binary.tn, "text-emerald-600"],
              ].map(([k, v, c]) => (
                <div key={k as string}>
                  <p className={`text-lg font-extrabold ${c}`}>{v as number}</p>
                  <p className="font-semibold text-slate-400">{k as string}</p>
                </div>
              ))}
            </div>

            <SectionTitle>Confusion matrix</SectionTitle>
            <div className="card overflow-x-auto p-4">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr>
                    <th className="p-1 text-left text-[10px] font-semibold text-slate-400">Truth ↓ / AI →</th>
                    {CATS.map((c) => (
                      <th key={c} className="p-1 font-bold text-slate-600">
                        {SHORT[c]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CATS.map((t, i) => (
                    <tr key={t}>
                      <td className="p-1 text-left font-bold text-slate-600">{SHORT[t]}</td>
                      {m.matrix[i].map((v, j) => (
                        <td key={j} className="p-1">
                          <div
                            className={`rounded-lg py-2.5 text-sm font-extrabold ${i === j ? "text-white" : v ? "text-rose-700" : "text-slate-300"}`}
                            style={{ background: i === j ? `rgba(11,133,153,${0.35 + (0.65 * v) / maxCell})` : v ? `rgba(244,63,94,${0.1 + (0.3 * v) / maxCell})` : "#f8fafc" }}
                          >
                            {v}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SectionTitle>Per-class performance</SectionTitle>
            <div className="card divide-y divide-slate-100">
              {m.perClass.map((c) => (
                <div key={c.cat} className="flex items-center gap-3 p-3.5">
                  <div className="flex-1">
                    <p className="text-sm font-bold capitalize text-ink">{c.cat === "health" ? "Healthy" : c.cat}</p>
                    <p className="text-[11px] text-slate-400">n = {c.support}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div>
                      <p className="font-extrabold text-ink">{pct(c.sensitivity)}</p>
                      <p className="text-[9px] uppercase text-slate-400">Recall</p>
                    </div>
                    <div>
                      <p className="font-extrabold text-ink">{pct(c.ppv)}</p>
                      <p className="text-[9px] uppercase text-slate-400">Precision</p>
                    </div>
                    <div>
                      <p className="font-extrabold text-ink">{c.f1 === null ? "—" : c.f1.toFixed(2)}</p>
                      <p className="text-[9px] uppercase text-slate-400">F1</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <SectionTitle>Periodontitis staging agreement</SectionTitle>
            <div className="card grid grid-cols-3 gap-2 p-4 text-center">
              <div>
                <p className="text-xl font-extrabold text-ink">{m.stage.n}</p>
                <p className="text-[10px] font-semibold uppercase text-slate-400">Staged pairs</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-brand-600">{pct(m.stage.exact)}</p>
                <p className="text-[10px] font-semibold uppercase text-slate-400">Exact stage</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-ink">{pct(m.stage.withinOne)}</p>
                <p className="text-[10px] font-semibold uppercase text-slate-400">Within ±1</p>
              </div>
            </div>
          </>
        )}

        <p className="mt-6 flex items-start gap-2 rounded-xl bg-slate-100 p-3 text-[11px] leading-relaxed text-slate-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Clinical applicability: the clinician&apos;s examination-based diagnosis (AAP/EFP 2017) is the reference standard. Kappa interpretation follows Landis &amp; Koch (1977).
          <Activity className="hidden" />
        </p>
      </div>
    </div>
  );
}
