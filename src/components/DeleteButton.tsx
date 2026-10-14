"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({ url, redirect, label = "Delete", confirmText }: { url: string; redirect: string; label?: string; confirmText: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        if (!confirm(confirmText)) return;
        setBusy(true);
        await fetch(url, { method: "DELETE" });
        router.push(redirect);
        router.refresh();
      }}
      className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 transition active:scale-[0.98] disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" /> {busy ? "Deleting…" : label}
    </button>
  );
}
