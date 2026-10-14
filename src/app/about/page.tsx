import { Brain, Camera, Cloud, Code2, Cpu, Database, Layers, ServerCog, Smartphone, Target } from "lucide-react";
import Header from "@/components/Header";
import { LogoMark } from "@/components/Logo";
import { SectionTitle } from "@/components/ui";
import { ENGINE_VERSION } from "@/lib/engine";

export const metadata = { title: "About" };

const PIPELINE = [
  { icon: Camera, t: "Image acquisition", d: "Intraoral photographs (retracted frontal view) and intraoral radiographs (IOPA/bitewing) captured via device camera or upload." },
  { icon: Layers, t: "Preprocessing", d: "Resizing, grayscale conversion, histogram equalisation, Sobel edge maps, Laplacian sharpness and contrast-based quality control (OpenCV-equivalent operations)." },
  { icon: Brain, t: "Feature extraction & model", d: "HSV gingival segmentation, redness/inflammation index, plaque detection and radiographic radiolucency-based bone loss estimation, fused with clinical parameters in a probabilistic classifier." },
  { icon: Cpu, t: "Decision layer", d: "AAP/EFP 2017 classification rules determine the case definition, stage (severity and complexity), grade (bone loss/age ratio and smoking) and extent." },
  { icon: ServerCog, t: "Backend API", d: "Secure REST API for analysis, storage and export. You can connect an external Python/TensorFlow inference service through AI_MODEL_URL." },
  { icon: Smartphone, t: "Android deployment", d: "An installable Progressive Web App that can be packaged as an Android App Bundle (Trusted Web Activity) for Google Play." },
];

const STACK = [
  { icon: Code2, t: "Python · TensorFlow", d: "CNN model training (external inference service)" },
  { icon: Layers, t: "OpenCV", d: "Image preprocessing pipeline" },
  { icon: Smartphone, t: "Android Studio", d: "TWA packaging & signing" },
  { icon: Database, t: "PostgreSQL", d: "Secure patient & image records" },
  { icon: Cloud, t: "Cloud sync", d: "Server-side storage, CSV export" },
  { icon: Code2, t: "VS Code · Codex", d: "Development & AI-assisted coding" },
];

export default function About() {
  return (
    <div>
      <Header title="About PerioAI" back />
      <div className="px-4 pt-4">
        <div className="brand-gradient animate-scale-in flex flex-col items-center rounded-3xl p-6 text-center text-white">
          <LogoMark size={80} className="animate-float ring-4 ring-white/20" />
          <h2 className="mt-3 text-2xl font-extrabold">
            Perio<span className="text-cyan-200">AI</span>
          </h2>
          <p className="mt-1 text-xs text-cyan-100">AI-assisted mobile application for the evaluation of periodontal diseases and treatment planning</p>
        </div>

        <SectionTitle>
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4 text-brand-600" /> Objectives
          </span>
        </SectionTitle>
        <div className="card space-y-3 p-4 text-[13px] text-slate-700">
          <p>
            <b>1.</b> To develop an AI-assisted mobile application for periodontal disease screening using clinical and radiographic parameters.
          </p>
          <p>
            <b>2.</b> To assess the diagnostic accuracy and clinical applicability of the developed AI-based mobile application in periodontal treatment planning.
          </p>
        </div>

        <SectionTitle>AI workflow</SectionTitle>
        <ol className="stagger space-y-2.5">
          {PIPELINE.map((s, i) => (
            <li key={s.t} className="card flex gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">
                  {i + 1}. {s.t}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <SectionTitle>Technology stack</SectionTitle>
        <div className="stagger grid grid-cols-2 gap-2.5">
          {STACK.map((s) => (
            <div key={s.t} className="card p-3.5">
              <s.icon className="h-5 w-5 text-brand-600" />
              <p className="mt-2 text-[13px] font-bold text-ink">{s.t}</p>
              <p className="text-[11px] text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="card mt-5 p-4 text-[11px] leading-relaxed text-slate-500">
          <p className="font-bold text-slate-700">Model information</p>
          <p className="mt-1">{ENGINE_VERSION}</p>
          <p className="mt-2">
            The built-in engine is a transparent baseline model. Once a TensorFlow model has been trained on the study dataset, set the AI_MODEL_URL environment variable and its
            predictions will override the baseline automatically. All outputs need clinician confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}
