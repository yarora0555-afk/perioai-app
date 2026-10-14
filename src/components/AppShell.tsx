"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  Brain,
  ChevronRight,
  ClipboardList,
  Home,
  LayoutGrid,
  Plus,
  ScanLine,
  ShieldCheck,
  Users,
} from "lucide-react";
import { LogoMark } from "./Logo";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/patients/new", label: "New", icon: Plus, fab: true },
  { href: "/validation", label: "Accuracy", icon: Activity },
  { href: "/more", label: "More", icon: LayoutGrid },
];

function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2600);
    const t2 = setTimeout(onDone, 3150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);
  return (
    <div
      className="brand-gradient fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden text-white"
      style={leaving ? { animation: "splash-out 0.55s ease forwards" } : undefined}
    >
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-teal-200/10 blur-3xl" />
      <div className="relative flex h-40 w-40 items-center justify-center">
        <span className="animate-ring absolute h-28 w-28 rounded-full border-2 border-cyan-200/60" />
        <span className="animate-ring absolute h-28 w-28 rounded-full border-2 border-cyan-200/40" style={{ animationDelay: "0.7s" }} />
        <span className="animate-ring absolute h-28 w-28 rounded-full border-2 border-cyan-200/30" style={{ animationDelay: "1.4s" }} />
        <div className="animate-logo-pop relative">
          <LogoMark size={112} className="shadow-2xl shadow-cyan-900/50 ring-4 ring-white/20" />
        </div>
      </div>
      <h1 className="animate-fade-up mt-6 text-4xl font-extrabold tracking-tight" style={{ animationDelay: "0.5s" }}>
        Perio<span className="text-cyan-200">AI</span>
      </h1>
      <p className="animate-fade-up mt-2 text-sm font-medium text-cyan-50/85" style={{ animationDelay: "0.75s" }}>
        AI-Assisted Periodontal Evaluation &amp; Treatment Planning
      </p>
      <div className="animate-fade-in mt-10 h-1 w-44 overflow-hidden rounded-full bg-white/20" style={{ animationDelay: "0.9s" }}>
        <div className="animate-progress h-full rounded-full bg-gradient-to-r from-cyan-200 to-white" style={{ animationDelay: "0.9s" }} />
      </div>
      <p className="animate-fade-in absolute bottom-10 text-[11px] uppercase tracking-[0.25em] text-cyan-100/70" style={{ animationDelay: "1.2s" }}>
        Clinical · Radiographic · AI
      </p>
    </div>
  );
}

const SLIDES = [
  {
    icon: ScanLine,
    title: "AI-Assisted Screening",
    text: "Analyse intraoral photographs and radiographs with an on-device image pipeline: enhancement, segmentation and quality checks.",
  },
  {
    icon: Brain,
    title: "2017 AAP/EFP Classification",
    text: "Combine clinical parameters with radiographic bone loss to stage and grade periodontitis automatically, and see the reasoning behind each result.",
  },
  {
    icon: ClipboardList,
    title: "Evidence-Based Treatment Plans",
    text: "Get step-wise treatment plans based on the EFP S3 guideline, plus risk scoring, prognosis and recall intervals.",
  },
  {
    icon: ShieldCheck,
    title: "Built for Clinical Research",
    text: "Check inclusion and exclusion criteria, capture digital consent, and measure diagnostic accuracy against a clinician gold standard.",
  },
];

function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  const Icon = s.icon;
  const last = i === SLIDES.length - 1;
  return (
    <div className="fixed inset-0 z-[90] flex justify-center bg-slate-900/40">
      <div className="relative flex h-full w-full max-w-md flex-col bg-white">
        <div className="brand-gradient relative flex h-[52%] items-center justify-center overflow-hidden rounded-b-[44px]">
          <div className="animate-spin-slow absolute h-72 w-72 rounded-full border border-dashed border-white/25" />
          <div className="absolute h-52 w-52 rounded-full border border-white/20" />
          <div key={i} className="animate-scale-in animate-float flex h-28 w-28 items-center justify-center rounded-[32px] bg-white/15 ring-1 ring-white/30 backdrop-blur">
            <Icon className="h-14 w-14 text-white" strokeWidth={1.6} />
          </div>
          <button onClick={onDone} className="absolute right-5 top-5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white">
            Skip
          </button>
        </div>
        <div key={`t${i}`} className="animate-slide-in flex flex-1 flex-col px-8 pt-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
            Step {i + 1} of {SLIDES.length}
          </p>
          <h2 className="mt-2 text-[28px] font-extrabold leading-tight text-ink">{s.title}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-500">{s.text}</p>
          {last && (
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
              PerioAI is a clinical decision-support tool for qualified dental professionals. It does not replace a clinician&apos;s diagnosis.
            </p>
          )}
        </div>
        <div className="flex items-center justify-between px-8 pb-10">
          <div className="flex gap-1.5">
            {SLIDES.map((_, k) => (
              <span key={k} className={`h-2 rounded-full transition-all duration-300 ${k === i ? "w-7 bg-brand-600" : "w-2 bg-slate-200"}`} />
            ))}
          </div>
          <button onClick={() => (last ? onDone() : setI(i + 1))} className="btn-primary !rounded-full !px-6">
            {last ? "Get Started" : "Next"} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"splash" | "onboarding" | "app">("splash");

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const finishSplash = () => {
    setPhase(localStorage.getItem("perioai_onboarded") ? "app" : "onboarding");
  };
  const finishOnboarding = () => {
    localStorage.setItem("perioai_onboarded", "1");
    setPhase("app");
  };

  const hideNav = /\/(new|assess)$/.test(pathname) || pathname.startsWith("/print");

  return (
    <>
      {phase === "splash" && <Splash onDone={finishSplash} />}
      {phase === "onboarding" && <Onboarding onDone={finishOnboarding} />}
      <div className="print-full relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-slate-50 shadow-2xl shadow-slate-900/10">
        <main className={`flex-1 ${hideNav ? "" : "pb-28"}`}>{children}</main>
        {!hideNav && (
          <nav className="no-print glass fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-slate-200/70 px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
            <ul className="grid grid-cols-5 items-end">
              {NAV.map((n) => {
                const active = n.href === "/" ? pathname === "/" : pathname === n.href || (pathname.startsWith(n.href + "/") && n.href !== "/patients") || (n.href === "/patients" && pathname.startsWith("/patients/") && !pathname.endsWith("/new"));
                const Icon = n.icon;
                if (n.fab)
                  return (
                    <li key={n.href} className="flex justify-center">
                      <Link href={n.href} aria-label="New patient" className="-mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-xl shadow-brand-700/40 ring-4 ring-white transition active:scale-95">
                        <Icon className="h-7 w-7" />
                      </Link>
                    </li>
                  );
                return (
                  <li key={n.href}>
                    <Link href={n.href} className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition ${active ? "text-brand-600" : "text-slate-400"}`}>
                      <Icon className={`h-[22px] w-[22px] transition-transform ${active ? "scale-110" : ""}`} strokeWidth={active ? 2.4 : 2} />
                      {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </>
  );
}
