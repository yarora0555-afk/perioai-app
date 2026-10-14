import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "PerioAI — Periodontal Evaluation & Treatment Planning",
    short_name: "PerioAI",
    description:
      "AI-assisted periodontal disease screening, AAP/EFP 2017 staging & grading and evidence-based treatment planning.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b3c49",
    theme_color: "#0b8599",
    categories: ["medical", "health", "productivity"],
    lang: "en",
    icons: [
      { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
