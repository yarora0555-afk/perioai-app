import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center px-8 text-center">
      <LogoMark size={72} className="animate-float" />
      <h1 className="mt-5 text-2xl font-extrabold text-ink">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">The record may have been deleted or the link is incorrect.</p>
      <Link href="/" className="btn-primary mt-6">
        Back to Home
      </Link>
    </div>
  );
}
