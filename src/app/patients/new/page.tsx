"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileSignature,
  ShieldX,
  User,
  XCircle,
} from "lucide-react";
import Header from "@/components/Header";
import SignaturePad from "@/components/SignaturePad";
import { EXCLUSION, INCLUSION, evaluateEligibility } from "@/lib/criteria";

const STEPS = [
  { label: "Details", icon: User },
  { label: "Inclusion", icon: ClipboardCheck },
  { label: "Exclusion", icon: ShieldX },
  { label: "Consent", icon: FileSignature },
];

export default function NewPatient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    age: "",
    sex: "Female",
    phone: "",
    teethCount: "28",
    smoking: "none",
    chiefComplaint: "",
    examiner: "",
  });
  const [inc, setInc] = useState<Record<string, boolean>>({});
  const [exc, setExc] = useState<Record<string, boolean | undefined>>({});
  const [openInc, setOpenInc] = useState(true);
  const [openExc, setOpenExc] = useState<string | null>(EXCLUSION[0].id);
  const [signature, setSignature] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const ex = localStorage.getItem("perioai_clinician");
    if (ex) setForm((f) => ({ ...f, examiner: f.examiner || ex }));
  }, []);

  const age = Number(form.age);
  const teeth = Number(form.teethCount);
  // Auto-verify objective criteria
  useEffect(() => {
    setInc((s) => ({
      ...s,
      age: form.age !== "" && age >= 18 && age <= 65,
      teeth: teeth >= 20,
    }));
  }, [age, teeth, form.age]);

  const excBool = useMemo(() => Object.fromEntries(EXCLUSION.map((c) => [c.id, exc[c.id] === true])), [exc]);
  const elig = evaluateEligibility(inc, excBool);
  const excAnswered = EXCLUSION.every((c) => exc[c.id] !== undefined);
  const incCount = INCLUSION.filter((c) => inc[c.id]).length;

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const canNext =
    step === 0
      ? form.name.trim().length > 1 && form.age !== "" && age > 0 && age < 120 && teeth >= 0 && teeth <= 32
      : step === 2
        ? excAnswered
        : true;

  async function submit() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age, teethCount: teeth, inclusion: inc, exclusion: excBool, consentSignature: agree ? signature : null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      if (form.examiner) localStorage.setItem("perioai_clinician", form.examiner);
      router.push(data.eligible ? `/patients/${data.id}/assess` : `/patients/${data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header title="Enrol Patient" subtitle="Screening & eligibility" back="/patients" />

      {/* Stepper */}
      <div className="px-5 pt-4">
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    i < step ? "bg-brand-600 text-white" : i === step ? "bg-brand-600 text-white ring-4 ring-brand-500/20" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span className={`text-[10px] font-semibold ${i <= step ? "text-brand-700" : "text-slate-400"}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mx-1 mb-4 h-0.5 flex-1 overflow-hidden rounded bg-slate-200">
                  <div className="h-full bg-brand-600 transition-all duration-500" style={{ width: i < step ? "100%" : "0%" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div key={step} className="animate-slide-in flex-1 px-4 pb-32 pt-5">
        {step === 0 && (
          <div className="card space-y-4 p-4">
            <div>
              <label className="label">Full name *</label>
              <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Patient full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Age (years) *</label>
                <input className="input" inputMode="numeric" type="number" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="e.g. 35" />
              </div>
              <div>
                <label className="label">Sex</label>
                <select className="input" value={form.sex} onChange={(e) => set("sex", e.target.value)}>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Natural teeth *</label>
                <input className="input" inputMode="numeric" type="number" min={0} max={32} value={form.teethCount} onChange={(e) => set("teethCount", e.target.value)} />
              </div>
              <div>
                <label className="label">Smoking</label>
                <select className="input" value={form.smoking} onChange={(e) => set("smoking", e.target.value)}>
                  <option value="none">Non-smoker</option>
                  <option value="lt10">&lt;10 cig/day</option>
                  <option value="gte10">≥10 cig/day</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="label">Chief complaint</label>
              <select className="input" value={form.chiefComplaint} onChange={(e) => set("chiefComplaint", e.target.value)}>
                <option value="">Select…</option>
                <option>Bleeding gums while brushing</option>
                <option>Swollen / red gums</option>
                <option>Bad breath (halitosis)</option>
                <option>Loose teeth</option>
                <option>Gum recession / sensitivity</option>
                <option>Spacing / drifting of teeth</option>
                <option>Routine check-up</option>
              </select>
            </div>
            <div>
              <label className="label">Examiner</label>
              <input className="input" value={form.examiner} onChange={(e) => set("examiner", e.target.value)} placeholder="Dr. …" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div className="card overflow-hidden">
              <button onClick={() => setOpenInc((o) => !o)} className="flex w-full items-center gap-3 p-4 text-left">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ClipboardCheck className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-bold text-ink">Inclusion Criteria</span>
                  <span className="text-xs text-slate-500">
                    {incCount} of {INCLUSION.length} satisfied
                  </span>
                </span>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${openInc ? "rotate-180" : ""}`} />
              </button>
              <div className="h-1 bg-slate-100">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(incCount / INCLUSION.length) * 100}%` }} />
              </div>
              <div className={`grid transition-all duration-300 ${openInc ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <ul className="divide-y divide-slate-100 px-2 py-1">
                    {INCLUSION.map((c) => {
                      const auto = c.id === "age" || c.id === "teeth";
                      const on = !!inc[c.id];
                      return (
                        <li key={c.id}>
                          <label className={`flex items-start gap-3 rounded-xl p-3 ${auto ? "" : "cursor-pointer active:bg-slate-50"}`}>
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={on}
                              disabled={auto}
                              onChange={(e) => setInc((s) => ({ ...s, [c.id]: e.target.checked }))}
                            />
                            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${on ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white"}`}>
                              {on && <Check className="h-4 w-4 animate-scale-in" strokeWidth={3} />}
                            </span>
                            <span className="flex-1">
                              <span className="block text-sm font-semibold text-slate-800">{c.label}</span>
                              <span className="text-xs text-slate-400">
                                {auto ? (on ? "Auto-verified from patient details" : "Not met based on patient details") : c.hint}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => setInc((s) => ({ ...s, ...Object.fromEntries(INCLUSION.filter((c) => c.id !== "age" && c.id !== "teeth").map((c) => [c.id, true])) }))}
                      className="w-full rounded-xl bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700"
                    >
                      Mark all subjective criteria as met
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {elig.missingInclusion.length > 0 && (
              <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {elig.missingInclusion.length} inclusion criteria not met. The patient can still be saved as a screening record but won&apos;t be enrolled in the study.
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2.5">
            <p className="px-1 text-xs text-slate-500">Open each item and answer Yes or No. A &quot;Yes&quot; answer excludes the patient from the study.</p>
            {EXCLUSION.map((c, i) => {
              const v = exc[c.id];
              const open = openExc === c.id;
              return (
                <div key={c.id} className={`card overflow-hidden transition ${v === true ? "ring-2 ring-rose-300" : v === false ? "ring-1 ring-emerald-200" : ""}`}>
                  <button onClick={() => setOpenExc(open ? null : c.id)} className="flex w-full items-center gap-3 p-3.5 text-left">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        v === true ? "bg-rose-100 text-rose-600" : v === false ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {v === true ? <XCircle className="h-4 w-4" /> : v === false ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-slate-800">{c.label}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <div className="px-3.5 pb-3.5">
                        {c.hint && <p className="mb-2.5 text-xs text-slate-400">{c.hint}</p>}
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { val: false, label: "No", cls: "bg-emerald-600 text-white" },
                            { val: true, label: "Yes", cls: "bg-rose-600 text-white" },
                          ].map((o) => (
                            <button
                              key={o.label}
                              onClick={() => {
                                setExc((s) => ({ ...s, [c.id]: o.val }));
                                const next = EXCLUSION[i + 1];
                                setTimeout(() => setOpenExc(next ? next.id : null), 180);
                              }}
                              className={`rounded-xl py-2.5 text-sm font-bold transition active:scale-95 ${v === o.val ? o.cls : "bg-slate-100 text-slate-600"}`}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => {
                setExc(Object.fromEntries(EXCLUSION.map((c) => [c.id, false])));
                setOpenExc(null);
              }}
              className="w-full rounded-xl bg-white py-2.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200"
            >
              Answer &quot;No&quot; to all
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className={`card animate-scale-in flex items-center gap-3 p-4 ${elig.eligible ? "bg-emerald-50 ring-emerald-200" : "bg-rose-50 ring-rose-200"}`}>
              {elig.eligible ? <CheckCircle2 className="h-9 w-9 text-emerald-600" /> : <XCircle className="h-9 w-9 text-rose-600" />}
              <div>
                <p className={`font-bold ${elig.eligible ? "text-emerald-800" : "text-rose-800"}`}>{elig.eligible ? "Eligible for study" : "Not eligible for study"}</p>
                <p className="text-xs text-slate-600">
                  {elig.eligible
                    ? "All inclusion criteria met and no exclusion criteria present."
                    : [...elig.missingInclusion.map((c) => `Missing: ${c.label}`), ...elig.presentExclusion.map((c) => `Excluded: ${c.label}`)].slice(0, 3).join(" • ")}
                </p>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-bold text-ink">Informed Consent</h3>
              <div className="mt-2 max-h-44 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                <p>
                  I, <b>{form.name || "the undersigned"}</b>, have been informed about the study &quot;Development of an Artificial Intelligence assisted mobile
                  application for the evaluation of periodontal diseases and treatment planning&quot;.
                </p>
                <p>
                  I understand that a periodontal examination, intraoral photographs and intraoral radiographs will be recorded. My data will be stored securely,
                  anonymised for analysis and used only for research and clinical care.
                </p>
                <p>
                  I understand that the AI output is a decision-support aid and that the final diagnosis and treatment are decided by the treating clinician.
                  Participation is voluntary and I may withdraw at any time without affecting my treatment.
                </p>
              </div>
              <label className="mt-3 flex cursor-pointer items-start gap-3">
                <input type="checkbox" className="mt-0.5 h-5 w-5 accent-brand-600" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span className="text-sm text-slate-700">The patient has read and understood the above and agrees to participate.</span>
              </label>
              <div className="mt-4">
                <SignaturePad onChange={setSignature} />
              </div>
            </div>
            {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          </div>
        )}
      </div>

      <div className="no-print glass fixed bottom-0 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 gap-3 border-t border-slate-200 px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-3">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="btn-ghost !px-4">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {step < 3 ? (
          <button disabled={!canNext} onClick={() => setStep(step + 1)} className="btn-primary flex-1">
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            disabled={saving || (elig.eligible && (!agree || !signature))}
            onClick={submit}
            className="btn-primary flex-1"
          >
            {saving ? "Saving…" : elig.eligible ? "Enrol & Start Assessment" : "Save Screening Record"}
          </button>
        )}
      </div>
    </div>
  );
}
