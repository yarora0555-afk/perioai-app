"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search, UserPlus, Users } from "lucide-react";
import { Avatar, CategoryBadge, fmtDate } from "@/components/ui";

type Row = {
  id: number;
  code: string;
  name: string;
  age: number;
  sex: string;
  eligible: boolean;
  createdAt: string;
  lastCategory: string | null;
  lastStage: string | null;
  visits: number;
};

const FILTERS = [
  { k: "all", label: "All" },
  { k: "eligible", label: "Eligible" },
  { k: "periodontitis", label: "Periodontitis" },
  { k: "gingivitis", label: "Gingivitis" },
  { k: "pending", label: "Not assessed" },
];

export default function PatientList({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (s && !r.name.toLowerCase().includes(s) && !r.code.toLowerCase().includes(s)) return false;
      if (f === "eligible") return r.eligible;
      if (f === "pending") return r.visits === 0;
      if (f === "periodontitis" || f === "gingivitis") return r.lastCategory === f;
      return true;
    });
  }, [rows, q, f]);

  return (
    <div className="px-4 pt-4">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className="input !pl-10" placeholder="Search by name or patient ID" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((x) => (
          <button
            key={x.k}
            onClick={() => setF(x.k)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${f === x.k ? "bg-brand-600 text-white shadow-md shadow-brand-600/30" : "bg-white text-slate-500 ring-1 ring-slate-200"}`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Users className="h-7 w-7" />
          </div>
          <p className="mt-3 font-bold text-ink">{rows.length ? "No matching patients" : "No patients yet"}</p>
          <p className="mt-1 text-sm text-slate-500">Enrol a patient after checking inclusion and exclusion criteria.</p>
          <Link href="/patients/new" className="btn-primary mt-5">
            <UserPlus className="h-4 w-4" /> Enrol patient
          </Link>
        </div>
      ) : (
        <div key={f + q} className="stagger mt-4 space-y-2.5">
          {list.map((r) => (
            <Link key={r.id} href={`/patients/${r.id}`} className="card flex items-center gap-3 p-3 transition active:scale-[0.98]">
              <Avatar name={r.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-ink">{r.name}</p>
                  {!r.eligible && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">Not eligible</span>}
                </div>
                <p className="text-[11px] text-slate-400">
                  {r.code} · {r.age}y · {r.sex} · {fmtDate(r.createdAt)}
                </p>
                <div className="mt-1">
                  {r.lastCategory ? (
                    <CategoryBadge cat={r.lastCategory} stage={r.lastStage} />
                  ) : (
                    <span className="text-[11px] font-semibold text-brand-600">Awaiting assessment</span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
