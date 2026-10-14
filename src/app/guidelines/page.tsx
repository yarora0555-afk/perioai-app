import { ChevronDown } from "lucide-react";
import Header from "@/components/Header";

export const metadata = { title: "Guidelines" };

const SECTIONS = [
  {
    t: "Case definitions",
    rows: [
      ["Periodontal health", "BOP <10%, PD ≤3 mm, no attachment loss"],
      ["Gingivitis (intact periodontium)", "BOP ≥10%; localised 10–30%, generalised >30%; no CAL"],
      ["Periodontitis", "Interdental CAL detectable at ≥2 non-adjacent teeth, or buccal/oral CAL ≥3 mm with PD >3 mm at ≥2 teeth"],
    ],
  },
  {
    t: "Staging: severity",
    rows: [
      ["Stage I", "Interdental CAL 1–2 mm · RBL <15% (coronal third) · no tooth loss"],
      ["Stage II", "CAL 3–4 mm · RBL 15–33% · no tooth loss"],
      ["Stage III", "CAL ≥5 mm · RBL to middle third or beyond · tooth loss ≤4"],
      ["Stage IV", "CAL ≥5 mm · RBL to middle third or beyond · tooth loss ≥5"],
    ],
  },
  {
    t: "Staging: complexity",
    rows: [
      ["Stage I", "Max PD ≤4 mm, mostly horizontal bone loss"],
      ["Stage II", "Max PD ≤5 mm, mostly horizontal bone loss"],
      ["Stage III", "PD ≥6 mm, vertical bone loss ≥3 mm, furcation Class II/III, moderate ridge defect"],
      ["Stage IV", "Complex rehabilitation needed: masticatory dysfunction, secondary occlusal trauma (mobility ≥2), bite collapse, drifting, flaring, <20 remaining teeth"],
    ],
  },
  {
    t: "Grading",
    rows: [
      ["Grade A (slow)", "% bone loss / age <0.25 · heavy biofilm with low destruction · non-smoker"],
      ["Grade B (moderate)", "% bone loss / age 0.25–1.0 · smoker <10 cig/day"],
      ["Grade C (rapid)", "% bone loss / age >1.0 · smoker ≥10 cig/day · destruction exceeds biofilm"],
    ],
  },
  {
    t: "Extent & pattern",
    rows: [
      ["Localised", "<30% of teeth involved"],
      ["Generalised", "≥30% of teeth involved"],
      ["Molar/incisor pattern", "Involvement limited to first molars and incisors"],
    ],
  },
  {
    t: "EFP S3 treatment steps",
    rows: [
      ["Step 1", "Behaviour change, OHI, supragingival PMPR, risk-factor control"],
      ["Step 2", "Subgingival instrumentation ± adjuncts"],
      ["Step 3", "Treat non-responding sites: re-instrumentation, access flap, regenerative or resective surgery"],
      ["Step 4", "Supportive periodontal care every 3–12 months based on risk"],
    ],
  },
];

export default function Guidelines() {
  return (
    <div>
      <Header title="Clinical Guidelines" subtitle="AAP/EFP 2017 World Workshop · EFP S3 (2020)" back />
      <div className="stagger space-y-2.5 px-4 pt-4">
        {SECTIONS.map((s, i) => (
          <details key={s.t} className="card group overflow-hidden" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-bold text-ink">
              {s.t}
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <dl className="divide-y divide-slate-100 px-4 pb-2">
              {s.rows.map(([k, v]) => (
                <div key={k} className="py-2.5">
                  <dt className="text-[13px] font-bold text-brand-700">{k}</dt>
                  <dd className="mt-0.5 text-xs leading-relaxed text-slate-600">{v}</dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
        <p className="px-1 pb-4 text-[11px] text-slate-400">
          References: Papapanou et al. 2018; Tonetti, Greenwell &amp; Kornman 2018; Chapple et al. 2018; Sanz et al. 2020 (EFP S3 guideline).
        </p>
      </div>
    </div>
  );
}
