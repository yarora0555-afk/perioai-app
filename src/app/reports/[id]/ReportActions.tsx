"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Printer, Share2, UserCheck } from "lucide-react";

export function PrintShare({ title }: { title: string }) {
  const [msg, setMsg] = useState("");
  return (
    <div className="no-print grid grid-cols-2 gap-2.5">
      <button onClick={() => window.print()} className="btn-ghost !py-3 text-sm">
        <Printer className="h-4 w-4" /> Print / PDF
      </button>
      <button
        onClick={async () => {
          const url = window.location.href;
          try {
            if (navigator.share) await navigator.share({ title, url });
            else {
              await navigator.clipboard.writeText(url);
              setMsg("Link copied");
              setTimeout(() => setMsg(""), 1800);
            }
          } catch {}
        }}
        className="btn-ghost !py-3 text-sm"
      >
        <Share2 className="h-4 w-4" /> {msg || "Share"}
      </button>
    </div>
  );
}

export function ClinicianValidation({ id, initialCat, initialStage, aiCat, aiStage }: { id: number; initialCat: string | null; initialStage: string | null; aiCat: string; aiStage: string | null }) {
  const router = useRouter();
  const [cat, setCat] = useState(initialCat ?? "");
  const [stage, setStage] = useState(initialStage ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/assessments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinicianCategory: cat || null, clinicianStage: stage || null }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  const agree = initialCat ? initialCat === aiCat && (aiCat !== "periodontitis" || !initialStage || initialStage === aiStage) : null;

  return (
    <div className="card no-print p-4">
      <div className="flex items-center gap-2">
        <UserCheck className="h-5 w-5 text-brand-600" />
        <p className="text-sm font-bold text-ink">Clinician gold-standard diagnosis</p>
      </div>
      <p className="mt-1 text-xs text-slate-500">Record the examiner&apos;s final diagnosis. It is used to measure the app&apos;s diagnostic accuracy.</p>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <select className="input !py-2.5" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Not recorded</option>
          <option value="health">Healthy</option>
          <option value="gingivitis">Gingivitis</option>
          <option value="periodontitis">Periodontitis</option>
        </select>
        <select className="input !py-2.5" value={stage} disabled={cat !== "periodontitis"} onChange={(e) => setStage(e.target.value)}>
          <option value="">Stage —</option>
          <option value="I">Stage I</option>
          <option value="II">Stage II</option>
          <option value="III">Stage III</option>
          <option value="IV">Stage IV</option>
        </select>
      </div>
      <button onClick={save} disabled={saving} className="btn-primary mt-3 w-full !py-3 text-sm">
        {saved ? (
          <>
            <CheckCircle2 className="h-4 w-4" /> Saved
          </>
        ) : saving ? (
          "Saving…"
        ) : (
          "Save validation"
        )}
      </button>
      {agree !== null && (
        <p className={`mt-3 rounded-xl p-2.5 text-center text-xs font-semibold ${agree ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {agree ? "✓ AI output agrees with the clinician diagnosis" : "✗ AI output differs from the clinician diagnosis"}
        </p>
      )}
    </div>
  );
}
