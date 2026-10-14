import Header from "@/components/Header";

export const metadata = { title: "Privacy Policy" };

const S = [
  ["Who we are", "PerioAI is a clinical decision-support application for qualified dental professionals. It is used to evaluate periodontal diseases and plan treatment as part of clinical care and approved research."],
  ["Data we collect", "Patient demographics (name, age, sex, optional phone number), eligibility screening answers, digital consent signatures, periodontal clinical parameters, intraoral photographs, intraoral radiographs, and AI analysis results. We do not collect device location, contacts or advertising identifiers."],
  ["How we use data", "Data is used only to generate periodontal assessments and treatment plans, keep patient records, and calculate the diagnostic accuracy of the application. Research exports use patient codes instead of names."],
  ["Camera permission", "The camera is used only when you choose to capture an intraoral photograph or radiograph. Images are compressed on the device before secure upload."],
  ["Storage & security", "Records are stored in a secured database and sent over encrypted HTTPS connections. Access is limited to authorised clinical and research staff."],
  ["Consent & withdrawal", "Written (digital) informed consent is obtained before enrolment. Patients may withdraw at any time, and their records can be permanently deleted from the patient profile."],
  ["Data sharing", "Data is not sold or shared with third parties. If an external AI inference service is configured, only the data needed for analysis is sent to it, under the same confidentiality obligations."],
  ["Retention", "Records are kept for the duration required by the study protocol and institutional policy, then deleted or anonymised."],
  ["Medical disclaimer", "AI outputs support but do not replace professional judgement. The treating clinician remains responsible for diagnosis and treatment."],
  ["Contact", "For privacy questions or data requests, contact the principal investigator or the institutional ethics committee."],
];

export default function Privacy() {
  return (
    <div>
      <Header title="Privacy Policy" subtitle="Effective 2026" back />
      <div className="stagger space-y-2.5 px-4 pt-4 pb-6">
        {S.map(([t, d], i) => (
          <section key={t} className="card p-4">
            <h2 className="text-sm font-bold text-ink">
              {i + 1}. {t}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{d}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
