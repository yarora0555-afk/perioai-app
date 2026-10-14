"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export default function Header({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: string | boolean;
  right?: ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="no-print glass sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200/60 px-4 pb-3 pt-[max(env(safe-area-inset-top),14px)]">
      {back && (
        <button
          aria-label="Back"
          onClick={() => (typeof back === "string" ? router.push(back) : router.back())}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[19px] font-bold text-ink">{title}</h1>
        {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
