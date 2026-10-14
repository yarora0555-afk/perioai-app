import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { Activity, BookOpen, ChevronRight, ClipboardCheck, ScanLine, Sparkles, UserPlus } from "lucide-react";
import { db } from "@/db";
import { assessments, patients } from "@/db/schema";
import { LogoMark } from "@/components/Logo";
import Greeting from "@/components/Greeting";
import { Avatar, CAT_COLOR, CategoryBadge, SectionTitle, fmtDate } from "@/components/ui";
import type { AnalysisResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [[{ pc }], [{ ac }], recent, cats] = await Promise.all([
    db.select({ pc: count() }).from(patients),
    db.select({ ac: count() }).from(assessments),
    db
      .select({ id: assessments.id, createdAt: assessments.createdAt, result: assessments.result, name: patients.name, code: patients.code })
      .from(assessments)
      .innerJoin(patients, eq(assessments.patientId, patients.id))
      .orderBy(desc(assessments.createdAt))
      .limit(5),
    db.select({ ai: assessments.aiCategory, cl: assessments.clinicianCategory }).from(assessments),
  ]);

  const dist = { health: 0, gingivitis: 0, periodontitis: 0 } as Record<string, number>;
  cats.forEach((c) => (dist[c.ai] = (dist[c.ai] ?? 0) + 1));
  const validated = cats.filter((c) => c.cl);
  const agreement = validated.length ? Math.round((validated.filter((c) => c.cl === c.ai).length / validated.length) * 100) : null;
  const total = cats.length || 1;

  const actions = [
    { href: "/patients/new", label: "New Patient", sub: "Screen & enrol", icon: UserPlus, tone: "from-brand-500 to-brand-700" },
    { href: "/patients", label: "AI Assessment", sub: "Select patient", icon: ScanLine, tone: "from-violet-500 to-indigo-600" },
    { href: "/validation", label: "Accuracy", sub: "Validation study", icon: Activity, tone: "from-rose-500 to-pink-600" },
    { href: "/guidelines", label: "Guidelines", sub: "AAP/EFP 2017", icon: BookOpen, tone: "from-amber-500 to-orange-600" },
  ];

  return (
    <div>
      <section className="brand-gradient relative overflow-hidden rounded-b-[36px] px-5 pb-20 pt-[max(env(safe-area-inset-top),20px)] text-white">
        <div className="absolute -right-16 -top-10 h-56 w-56 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark size={38} className="ring-2 ring-white/30" />
            <span className="text-lg font-extrabold tracking-tight">
              Perio<span className="text-cyan-200">AI</span>
            </span>
          </div>
          <Link href="/more" className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/25">
            Settings
          </Link>
        </div>
        <div className="relative mt-7 animate-fade-up">
          <p className="text-sm text-cyan-100/90">
            <Greeting />
          </p>
          <h1 className="mt-1 text-[26px] font-extrabold leading-tight">
            Periodontal evaluation,
            <br />
            assisted by AI.
          </h1>
        </div>
      </section>

      <div className="relative -mt-14 px-4">
        <div className="card stagger grid grid-cols-3 divide-x divide-slate-100 p-4">
          <div className="text-center">
            <p className="text-2xl font-extrabold text-ink">{pc}</p>
            <p className="text-[11px] font-semibold text-slate-400">Patients</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-ink">{ac}</p>
            <p className="text-[11px] font-semibold text-slate-400">Assessments</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-brand-600">{agreement === null ? "—" : `${agreement}%`}</p>
            <p className="text-[11px] font-semibold text-slate-400">AI agreement</p>
          </div>
        </div>

        <SectionTitle>Quick actions</SectionTitle>
        <div className="stagger grid grid-cols-2 gap-3">
          {actions.map((a) => (
            <Link key={a.href} href={a.href} className="card group flex flex-col gap-3 p-4 transition active:scale-[0.97]">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${a.tone} text-white shadow-lg`}>
                <a.icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[15px] font-bold text-ink">{a.label}</span>
                <span className="text-xs text-slate-400">{a.sub}</span>
              </span>
            </Link>
          ))}
        </div>

        <SectionTitle>Disease distribution</SectionTitle>
        <div className="card p-4">
          <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
            {(["health", "gingivitis", "periodontitis"] as const).map((k) => (
              <div key={k} style={{ width: `${(dist[k] / total) * 100}%`, background: CAT_COLOR[k], transition: "width 1s" }} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 text-center">
            {(["health", "gingivitis", "periodontitis"] as const).map((k) => (
              <div key={k}>
                <p className="text-lg font-extrabold text-ink">{dist[k]}</p>
                <p className="flex items-center justify-center gap-1 text-[11px] font-semibold capitalize text-slate-400">
                  <span className="h-2 w-2 rounded-full" style={{ background: CAT_COLOR[k] }} />
                  {k === "health" ? "Healthy" : k}
                </p>
              </div>
            ))}
          </div>
        </div>

        <SectionTitle
          action={
            <Link href="/patients" className="text-xs font-semibold text-brand-600">
              View all
            </Link>
          }
        >
          Recent assessments
        </SectionTitle>
        {recent.length === 0 ? (
          <div className="card flex flex-col items-center p-8 text-center">
            <div className="animate-float flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600">
              <Sparkles className="h-8 w-8" />
            </div>
            <p className="mt-4 font-bold text-ink">No assessments yet</p>
            <p className="mt-1 text-sm text-slate-500">Enrol a patient to start your first AI-assisted periodontal evaluation.</p>
            <Link href="/patients/new" className="btn-primary mt-5">
              <ClipboardCheck className="h-4 w-4" /> Start screening
            </Link>
          </div>
        ) : (
          <div className="stagger space-y-2.5">
            {recent.map((r) => {
              const res = r.result as AnalysisResult;
              return (
                <Link key={r.id} href={`/reports/${r.id}`} className="card flex items-center gap-3 p-3 transition active:scale-[0.98]">
                  <Avatar name={r.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{r.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {r.code} · {fmtDate(r.createdAt)}
                    </p>
                    <div className="mt-1">
                      <CategoryBadge cat={res.category} stage={res.stage} grade={res.grade} />
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
