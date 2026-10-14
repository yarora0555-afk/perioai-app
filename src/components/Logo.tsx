import Image from "next/image";

export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/icons/icon-192.png"
      alt="PerioAI"
      width={size}
      height={size}
      className={`rounded-[22%] ${className}`}
      priority
    />
  );
}

export function LogoWord({ light = false }: { light?: boolean }) {
  return (
    <span className={`text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>
      Perio<span className={light ? "text-cyan-200" : "text-brand-600"}>AI</span>
    </span>
  );
}
