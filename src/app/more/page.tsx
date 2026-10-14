"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, ChevronRight, Database, Download, Info, RotateCcw, ShieldCheck, Smartphone, UserRound } from "lucide-react";
import Header from "@/components/Header";
import { LogoMark } from "@/components/Logo";

export default function MorePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [demo, setDemo] = useState<"idle" | "busy" | "done">("idle");

  useEffect(() => {
    setName(localStorage.getItem("perioai_clinician") ?? "");
  }, []);

  const links = [
    { href: "/guidelines", icon: BookOpen, label: "Clinical guidelines", sub: "AAP/EFP 2017 staging & grading" },
    { href: "/about", icon: Info, label: "About PerioAI", sub: "AI pipeline, methodology, version" },
    { href: "/privacy", icon: ShieldCheck, label: "Privacy policy", sub: "Data protection & consent" },
  ];

  return (
    <div>
      <Header title="More" subtitle="Settings & resources" />
      <div className="stagger space-y-4 px-4 pt-4">
        <div className="card flex items-center gap-3 p-4">
          <LogoMark size={52} />
          <div className="flex-1">
            <p className="text-lg font-extrabold text-ink">
              Perio<span className="text-brand-600">AI</span>
            </p>
            <p className="text-xs text-slate-500">Version 1.0.0 · Clinical decision support</p>
          </div>
        </div>

        <div className="card p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
            <UserRound className="h-4 w-4 text-brand-600" /> Clinician profile
          </p>
          <div className="flex gap-2">
            <input className="input" placeholder="Dr. Name" value={name} onChange={(e) => setName(e.target.value)} />
            <button
              onClick={() => {
                localStorage.setItem("perioai_clinician", name.trim());
                setSaved(true);
                setTimeout(() => setSaved(false), 1500);
              }}
              className="btn-primary !px-4 text-sm"
            >
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        <div className="card divide-y divide-slate-100">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center gap-3 p-4 active:bg-slate-50">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <l.icon className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-ink">{l.label}</span>
                <span className="text-[11px] text-slate-400">{l.sub}</span>
              </span>
              <ChevronRight className="h-5 w-5 text-slate-300" />
            </Link>
          ))}
        </div>

        <div className="card divide-y divide-slate-100">
          <a href="/api/export" className="flex items-center gap-3 p-4 active:bg-slate-50">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Download className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-ink">Export study data</span>
              <span className="text-[11px] text-slate-400">CSV for SPSS / R / Excel analysis</span>
            </span>
          </a>
          <button
            disabled={demo !== "idle"}
            onClick={async () => {
              if (!confirm("Add 10 demo patients with assessments and clinician validations?")) return;
              setDemo("busy");
              await fetch("/api/demo", { method: "POST" });
              setDemo("done");
              router.refresh();
            }}
            className="flex w-full items-center gap-3 p-4 text-left active:bg-slate-50 disabled:opacity-60"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Database className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-ink">{demo === "done" ? "Demo data loaded ✓" : demo === "busy" ? "Loading…" : "Load demo dataset"}</span>
              <span className="text-[11px] text-slate-400">Sample cases for training & demonstration</span>
            </span>
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("perioai_onboarded");
              window.location.href = "/";
            }}
            className="flex w-full items-center gap-3 p-4 text-left active:bg-slate-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <RotateCcw className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-ink">Replay intro</span>
              <span className="text-[11px] text-slate-400">Show splash & onboarding again</span>
            </span>
          </button>
        </div>

        <div className="card flex items-start gap-3 p-4">
          <Smartphone className="mt-0.5 h-5 w-5 text-brand-600" />
          <p className="text-xs leading-relaxed text-slate-500">
            <b className="text-slate-700">Install as an app:</b> open the browser menu and tap &quot;Add to Home screen&quot; / &quot;Install app&quot;. The same build can be packaged for
            Google Play as a Trusted Web Activity (Bubblewrap / PWABuilder).
          </p>
        </div>
      </div>
    </div>
  );
}
