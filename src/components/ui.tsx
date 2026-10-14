import type { ReactNode } from "react";

const CAT_STYLE: Record<string, string> = {
  health: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  gingivitis: "bg-amber-50 text-amber-700 ring-amber-200",
  periodontitis: "bg-rose-50 text-rose-700 ring-rose-200",
};
const CAT_SHORT: Record<string, string> = { health: "Healthy", gingivitis: "Gingivitis", periodontitis: "Periodontitis" };

export function CategoryBadge({ cat, stage, grade }: { cat: string; stage?: string | null; grade?: string | null }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${CAT_STYLE[cat] ?? "bg-slate-50 text-slate-600 ring-slate-200"}`}>
      {CAT_SHORT[cat] ?? cat}
      {stage ? ` · St ${stage}` : ""}
      {grade ? ` · Gr ${grade}` : ""}
    </span>
  );
}

export const CAT_COLOR: Record<string, string> = { health: "#10b981", gingivitis: "#f59e0b", periodontitis: "#f43f5e" };

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex items-center justify-between px-1">
      <h2 className="text-[15px] font-bold text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 40%))` }}
    >
      {initials}
    </div>
  );
}

export function Ring({ value, size = 84, stroke = 8, color = "#0b8599", label }: { value: number; size?: number; stroke?: number; color?: string; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, Math.max(0, value)) / 100)}
          style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold text-ink">{Math.round(value)}%</span>
        {label && <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>}
      </div>
    </div>
  );
}

export function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
