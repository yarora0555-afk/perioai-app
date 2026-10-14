"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Brain,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Droplets,
  FileImage,
  Layers,
  Loader2,
  Minus,
  Plus,
  Ruler,
  ScanLine,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import { analyzePhoto, analyzeRadiograph, compressImage, type PhotoAnalysis, type RadiographAnalysis } from "@/lib/imageAnalysis";
import { defaultClinical, type ClinicalData, type ImageFeatures } from "@/lib/types";

type P = { id: number; name: string; code: string; age: number; teethCount: number; smoking: string; eligible: boolean };

const STEPS = [
  { label: "Indices", icon: Droplets },
  { label: "Perio Chart", icon: Ruler },
  { label: "Imaging", icon: Camera },
  { label: "Review", icon: Brain },
];

function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; label: string; sub?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          onClick={() => onChange(o.v)}
          className={`rounded-xl px-1 py-2.5 text-center transition active:scale-95 ${value === o.v ? "bg-brand-600 text-white shadow-md shadow-brand-600/30" : "bg-slate-100 text-slate-600"}`}
        >
          <span className="block text-sm font-bold">{o.label}</span>
          {o.sub && <span className={`block text-[9px] font-medium leading-tight ${value === o.v ? "text-cyan-100" : "text-slate-400"}`}>{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

function Stepper({ value, onChange, min = 0, max = 15, step = 1, unit = "mm" }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string }) {
  const fix = (v: number) => Math.round(Math.min(max, Math.max(min, v)) * 10) / 10;
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(fix(value - step))} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-90">
        <Minus className="h-4 w-4" />
      </button>
      <div className="min-w-16 flex-1 text-center">
        <span className="text-xl font-extrabold text-ink">{value}</span>
        <span className="ml-1 text-xs text-slate-400">{unit}</span>
      </div>
      <button type="button" onClick={() => onChange(fix(value + step))} className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 active:scale-90">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-ink">{label}</span>
        {hint && <span className="text-right text-[11px] text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center gap-3 py-2.5 text-left">
      <span className="flex-1">
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
      </span>
      <span className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-brand-600" : "bg-slate-200"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

const Q = { good: "bg-emerald-100 text-emerald-700", acceptable: "bg-amber-100 text-amber-700", poor: "bg-rose-100 text-rose-700" };

function ImageCard({
  title,
  subtitle,
  icon: Icon,
  image,
  busy,
  previews,
  stats,
  quality,
  onPick,
  onClear,
}: {
  title: string;
  subtitle: string;
  icon: typeof Camera;
  image: string | null;
  busy: boolean;
  previews: { label: string; src: string }[];
  stats: { label: string; value: string }[];
  quality?: "good" | "acceptable" | "poor";
  onPick: (f: File) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState(0);
  const all = image ? [{ label: "Original", src: image }, ...previews] : [];
  const shown = all[Math.min(tab, all.length - 1)];
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-ink">{title}</p>
          <p className="text-[11px] text-slate-400">{subtitle}</p>
        </div>
        {quality && <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${Q[quality]}`}>{quality}</span>}
        {image && (
          <button onClick={onClear} aria-label="Remove" className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
      {!image ? (
        <button onClick={() => ref.current?.click()} className="mx-4 mb-4 flex w-[calc(100%-2rem)] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 py-9 text-brand-700 transition active:scale-[0.98]">
          <Camera className="h-8 w-8" />
          <span className="text-sm font-bold">Capture or upload</span>
          <span className="text-[11px] text-brand-600/70">JPG / PNG · camera supported</span>
        </button>
      ) : (
        <div className="px-4 pb-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {shown && <img key={shown.label} src={shown.src} alt={shown.label} className="animate-fade-in h-full w-full object-contain" />}
            {busy && (
              <>
                <div className="absolute inset-0 bg-cyan-500/10" />
                <div className="scan-line" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-semibold text-cyan-200">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Preprocessing…
                </div>
              </>
            )}
          </div>
          {all.length > 1 && (
            <div className="mt-2.5 flex gap-1.5">
              {all.map((p, i) => (
                <button key={p.label} onClick={() => setTab(i)} className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold transition ${tab === i ? "bg-ink text-white" : "bg-slate-100 text-slate-500"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
          {stats.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl bg-slate-50 p-2 text-center">
                  <p className="text-sm font-extrabold text-ink">{s.value}</p>
                  <p className="text-[9px] font-semibold uppercase text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => ref.current?.click()} className="mt-3 w-full rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600">
            Retake / replace
          </button>
        </div>
      )}
    </div>
  );
}

const ANALYSIS_STEPS = [
  { icon: Layers, label: "Image preprocessing", sub: "Normalisation · histogram equalisation · denoise" },
  { icon: ScanLine, label: "Feature extraction", sub: "Gingival segmentation · radiographic bone level" },
  { icon: Cpu, label: "Clinical–image data fusion", sub: "PD · CAL · BOP · RBL · risk factors" },
  { icon: Brain, label: "Classification", sub: "AAP/EFP 2017 staging & grading" },
  { icon: Stethoscope, label: "Treatment planning", sub: "EFP S3 step-wise protocol" },
];

function Analyzing({ active }: { active: number }) {
  return (
    <div className="brand-gradient fixed inset-0 z-[80] flex justify-center text-white">
      <div className="flex w-full max-w-md flex-col items-center px-8 pt-20">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <span className="animate-ring absolute h-28 w-28 rounded-full border-2 border-cyan-200/60" />
          <span className="animate-ring absolute h-28 w-28 rounded-full border-2 border-cyan-200/40" style={{ animationDelay: "1s" }} />
          <div className="animate-spin-slow absolute h-36 w-36 rounded-full border-2 border-dashed border-white/30" />
          <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-white/15 ring-1 ring-white/30 backdrop-blur">
            <Brain className="h-12 w-12" />
          </div>
        </div>
        <h2 className="mt-6 text-2xl font-extrabold">Analysing…</h2>
        <p className="mt-1 text-sm text-cyan-100/80">PerioAI is evaluating the periodontal status</p>
        <ul className="mt-8 w-full space-y-3">
          {ANALYSIS_STEPS.map((s, i) => {
            const done = i < active;
            const cur = i === active;
            return (
              <li key={s.label} className={`flex items-center gap-3 rounded-2xl p-3 transition-all duration-500 ${cur ? "bg-white/15 ring-1 ring-white/25" : ""} ${i > active ? "opacity-40" : ""}`}>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${done ? "bg-emerald-400 text-emerald-950" : "bg-white/15"}`}>
                  {done ? <Check className="h-5 w-5" /> : cur ? <Loader2 className="h-5 w-5 animate-spin" /> : <s.icon className="h-5 w-5" />}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold">{s.label}</span>
                  <span className="text-[11px] text-cyan-100/70">{s.sub}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default function AssessWizard({ patient }: { patient: P }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [c, setC] = useState<ClinicalData>({ ...defaultClinical, teethPresent: patient.teethCount });
  const [manualRBL, setManualRBL] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [radio, setRadio] = useState<string | null>(null);
  const [photoA, setPhotoA] = useState<PhotoAnalysis | null>(null);
  const [radioA, setRadioA] = useState<RadiographAnalysis | null>(null);
  const [busy, setBusy] = useState<{ photo: boolean; radio: boolean }>({ photo: false, radio: false });
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(-1);
  const [error, setError] = useState("");

  const up = <K extends keyof ClinicalData>(k: K, v: ClinicalData[K]) => setC((s) => ({ ...s, [k]: v }));

  async function pickPhoto(f: File) {
    setBusy((b) => ({ ...b, photo: true }));
    try {
      const url = await compressImage(f);
      setPhoto(url);
      setPhotoA(null);
      const [a] = await Promise.all([analyzePhoto(url), new Promise((r) => setTimeout(r, 1400))]);
      setPhotoA(a as PhotoAnalysis);
    } catch {
      setError("Could not read the photograph.");
    }
    setBusy((b) => ({ ...b, photo: false }));
  }
  async function pickRadio(f: File) {
    setBusy((b) => ({ ...b, radio: true }));
    try {
      const url = await compressImage(f, 1400, 0.9);
      setRadio(url);
      setRadioA(null);
      const [a] = await Promise.all([analyzeRadiograph(url), new Promise((r) => setTimeout(r, 1600))]);
      setRadioA(a as RadiographAnalysis);
    } catch {
      setError("Could not read the radiograph.");
    }
    setBusy((b) => ({ ...b, radio: false }));
  }

  async function run() {
    setError("");
    setAnalyzing(0);
    const features: ImageFeatures = {};
    if (photoA) features.photo = photoA.features;
    if (radioA) features.radiograph = radioA.features;
    const clinical: ClinicalData = { ...c, rblPercent: manualRBL ? c.rblPercent ?? 0 : null };
    const timer = setInterval(() => setAnalyzing((a) => Math.min(a + 1, ANALYSIS_STEPS.length - 1)), 750);
    try {
      const [res] = await Promise.all([
        fetch("/api/assessments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId: patient.id, clinical, photo, radiograph: radio, imageFeatures: features, notes }),
        }),
        new Promise((r) => setTimeout(r, 3900)),
      ]);
      const data = await (res as Response).json();
      if (!(res as Response).ok) throw new Error(data.error || "Analysis failed");
      clearInterval(timer);
      setAnalyzing(ANALYSIS_STEPS.length);
      setTimeout(() => {
        router.push(`/reports/${data.id}`);
        router.refresh();
      }, 450);
    } catch (e) {
      clearInterval(timer);
      setAnalyzing(-1);
      setError(e instanceof Error ? e.message : "Analysis failed");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {analyzing >= 0 && <Analyzing active={analyzing} />}
      <Header title="AI Assessment" subtitle={`${patient.name} · ${patient.code} · ${patient.age}y`} back={`/patients/${patient.id}`} />

      <div className="px-5 pt-4">
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <button key={s.label} onClick={() => i < step && setStep(i)} className="flex-1 text-left">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: i <= step ? "100%" : "0%" }} />
              </div>
              <span className={`mt-1.5 flex items-center gap-1 text-[10px] font-bold ${i <= step ? "text-brand-700" : "text-slate-400"}`}>
                <s.icon className="h-3 w-3" /> {s.label}
              </span>
            </button>
          ))}
        </div>
        {!patient.eligible && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-800 ring-1 ring-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" /> Patient does not meet study eligibility, so this will be recorded as a screening assessment only.
          </p>
        )}
      </div>

      <div key={step} className="animate-slide-in flex-1 space-y-3 px-4 pb-32 pt-4">
        {step === 0 && (
          <>
            <Field label="Plaque Index" hint="Silness & Löe (1964)">
              <Segmented
                value={c.plaqueIndex}
                onChange={(v) => up("plaqueIndex", v)}
                options={[
                  { v: 0, label: "0", sub: "No plaque" },
                  { v: 1, label: "1", sub: "Film on probe" },
                  { v: 2, label: "2", sub: "Visible" },
                  { v: 3, label: "3", sub: "Abundant" },
                ]}
              />
            </Field>
            <Field label="Gingival Index" hint="Löe & Silness (1963)">
              <Segmented
                value={c.gingivalIndex}
                onChange={(v) => up("gingivalIndex", v)}
                options={[
                  { v: 0, label: "0", sub: "Normal" },
                  { v: 1, label: "1", sub: "Mild, no BOP" },
                  { v: 2, label: "2", sub: "Moderate, BOP" },
                  { v: 3, label: "3", sub: "Severe" },
                ]}
              />
            </Field>
            <Field label="Bleeding on Probing" hint="% of sites">
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={100} value={c.bopPercent} onChange={(e) => up("bopPercent", Number(e.target.value))} className="flex-1" />
                <span className={`w-14 rounded-lg py-1 text-center text-sm font-extrabold ${c.bopPercent < 10 ? "bg-emerald-50 text-emerald-700" : c.bopPercent <= 30 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                  {c.bopPercent}%
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">&lt;10% health · 10–30% localised · &gt;30% generalised gingivitis</p>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Teeth present">
                <Stepper value={c.teethPresent} onChange={(v) => up("teethPresent", v)} min={0} max={32} unit="" />
              </Field>
              <Field label="Lost to perio">
                <Stepper value={c.teethLostPerio} onChange={(v) => up("teethLostPerio", v)} min={0} max={20} unit="" />
              </Field>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mean PD">
                <Stepper value={c.meanPD} onChange={(v) => up("meanPD", v)} step={0.1} max={12} />
              </Field>
              <Field label="Max PD">
                <Stepper value={c.maxPD} onChange={(v) => up("maxPD", v)} max={15} />
              </Field>
            </div>
            <Field label="Max interdental CAL" hint="Site of greatest loss">
              <Stepper value={c.maxCAL} onChange={(v) => up("maxCAL", v)} max={15} />
              <p className="mt-2 text-[11px] text-slate-400">1–2 mm Stage I · 3–4 mm Stage II · ≥5 mm Stage III/IV</p>
            </Field>
            <Field label="Teeth with attachment loss" hint="Extent (% of teeth)">
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={100} value={c.teethWithCALPercent} onChange={(e) => up("teethWithCALPercent", Number(e.target.value))} className="flex-1" />
                <span className="w-14 rounded-lg bg-slate-100 py-1 text-center text-sm font-extrabold text-ink">{c.teethWithCALPercent}%</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">&lt;30% localised · ≥30% generalised</p>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Furcation">
                <select className="input !py-2.5" value={c.furcation} onChange={(e) => up("furcation", e.target.value as ClinicalData["furcation"])}>
                  <option value="none">None</option>
                  <option value="I">Class I</option>
                  <option value="II">Class II</option>
                  <option value="III">Class III</option>
                </select>
              </Field>
              <Field label="Pattern">
                <select className="input !py-2.5" value={c.pattern} onChange={(e) => up("pattern", e.target.value as ClinicalData["pattern"])}>
                  <option value="generalized">Generalised</option>
                  <option value="localized">Localised</option>
                  <option value="molar-incisor">Molar–incisor</option>
                </select>
              </Field>
            </div>
            <Field label="Tooth mobility" hint="Miller's index">
              <Segmented value={c.mobility} onChange={(v) => up("mobility", v)} options={[0, 1, 2, 3].map((v) => ({ v: v as 0 | 1 | 2 | 3, label: `Grade ${v}` }))} />
            </Field>
            <div className="card divide-y divide-slate-100 px-4 py-1">
              <Toggle label="Vertical bone defect ≥3 mm" sub="Angular / intrabony defect" checked={c.verticalDefect} onChange={(v) => up("verticalDefect", v)} />
              <Toggle label="Gingival recession" checked={c.recession} onChange={(v) => up("recession", v)} />
              <Toggle label="Suppuration on probing" checked={c.suppuration} onChange={(v) => up("suppuration", v)} />
              <Toggle label="Masticatory dysfunction" sub="Bite collapse, drifting, flaring" checked={c.masticatoryDysfunction} onChange={(v) => up("masticatoryDysfunction", v)} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <ImageCard
              title="Intraoral photograph"
              subtitle="Frontal view, retracted, good lighting"
              icon={Camera}
              image={photo}
              busy={busy.photo}
              quality={photoA?.features.quality}
              previews={photoA ? [{ label: "Segmentation", src: photoA.previews.mask }, { label: "Enhanced", src: photoA.previews.enhanced }] : []}
              stats={
                photoA
                  ? [
                      { label: "Inflammation", value: `${photoA.features.inflammationScore.toFixed(1)}/3` },
                      { label: "Plaque", value: `${photoA.features.plaqueScore.toFixed(1)}/3` },
                      { label: "Gingiva area", value: `${Math.round(photoA.features.gingivaCoverage * 100)}%` },
                    ]
                  : []
              }
              onPick={pickPhoto}
              onClear={() => {
                setPhoto(null);
                setPhotoA(null);
              }}
            />
            <ImageCard
              title="Intraoral radiograph"
              subtitle="IOPA / bitewing, digital or scanned"
              icon={FileImage}
              image={radio}
              busy={busy.radio}
              quality={radioA?.features.quality}
              previews={radioA ? [{ label: "Equalised", src: radioA.previews.enhanced }, { label: "Edges", src: radioA.previews.edges }] : []}
              stats={
                radioA
                  ? [
                      { label: "Est. bone loss", value: `${radioA.features.estimatedRBL}%` },
                      { label: "Contrast", value: String(radioA.features.contrast) },
                      { label: "Sharpness", value: String(radioA.features.sharpness) },
                    ]
                  : []
              }
              onPick={pickRadio}
              onClear={() => {
                setRadio(null);
                setRadioA(null);
              }}
            />
            <Field label="Radiographic bone loss" hint={manualRBL ? "Manual measurement" : radioA ? "Using AI estimate" : "Not measured"}>
              <Toggle label="Enter measured bone loss manually" sub="% of root length at worst site" checked={manualRBL} onChange={(v) => { setManualRBL(v); if (v && c.rblPercent === null) up("rblPercent", radioA?.features.estimatedRBL ?? 10); }} />
              {manualRBL && (
                <div className="mt-2 flex items-center gap-3">
                  <input type="range" min={0} max={90} value={c.rblPercent ?? 0} onChange={(e) => up("rblPercent", Number(e.target.value))} className="flex-1" />
                  <span className="w-14 rounded-lg bg-slate-100 py-1 text-center text-sm font-extrabold text-ink">{c.rblPercent ?? 0}%</span>
                </div>
              )}
              <label className="label mt-3">Bone loss extends to</label>
              <select className="input !py-2.5" value={c.rblLocation} onChange={(e) => up("rblLocation", e.target.value as ClinicalData["rblLocation"])}>
                <option value="none">No bone loss / not assessed</option>
                <option value="coronal">Coronal third (&lt;15% / 15–33%)</option>
                <option value="middle">Middle third</option>
                <option value="apical">Apical third</option>
              </select>
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <div className="card p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                <Sparkles className="h-4 w-4 text-brand-600" /> Data summary
              </p>
              <dl className="grid grid-cols-3 gap-2 text-center">
                {[
                  ["PI", c.plaqueIndex],
                  ["GI", c.gingivalIndex],
                  ["BOP", `${c.bopPercent}%`],
                  ["Mean PD", `${c.meanPD}mm`],
                  ["Max PD", `${c.maxPD}mm`],
                  ["Max CAL", `${c.maxCAL}mm`],
                  ["Extent", `${c.teethWithCALPercent}%`],
                  ["Furcation", c.furcation === "none" ? "—" : c.furcation],
                  ["Mobility", c.mobility],
                  ["Teeth", c.teethPresent],
                  ["Lost", c.teethLostPerio],
                  ["RBL", manualRBL ? `${c.rblPercent}%` : radioA ? `~${radioA.features.estimatedRBL}%` : "—"],
                ].map(([k, v]) => (
                  <div key={String(k)} className="rounded-xl bg-slate-50 p-2">
                    <dd className="text-sm font-extrabold text-ink">{String(v)}</dd>
                    <dt className="text-[9px] font-semibold uppercase text-slate-400">{k}</dt>
                  </div>
                ))}
              </dl>
              <div className="mt-3 flex gap-2 text-[11px]">
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${photo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {photo ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />} Photograph
                </span>
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${radio ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {radio ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />} Radiograph
                </span>
              </div>
            </div>
            {!radio && !manualRBL && (
              <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> No radiographic data. Grading will default to Grade B and confidence will be lower.
              </p>
            )}
            <div className="card p-4">
              <label className="label">Clinical notes</label>
              <textarea className="input min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional findings, tooth-specific notes…" />
            </div>
            {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          </>
        )}
      </div>

      <div className="glass fixed bottom-0 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 gap-3 border-t border-slate-200 px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-3">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="btn-ghost !px-4">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} disabled={busy.photo || busy.radio} className="btn-primary flex-1">
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={run} disabled={analyzing >= 0} className="btn-primary flex-1 bg-gradient-to-r from-brand-500 to-brand-700">
            <Brain className="h-5 w-5" /> Run AI Analysis
          </button>
        )}
      </div>
    </div>
  );
}
