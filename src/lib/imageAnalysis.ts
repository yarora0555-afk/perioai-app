"use client";

import type { ImageFeatures } from "./types";

const WORK = 384;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** Resize + JPEG compress for storage (max 1280px). */
export async function compressImage(file: File, max = 1280, quality = 0.85): Promise<string> {
  const src = await fileToDataUrl(file);
  const img = await loadImage(src);
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

async function getPixels(src: string) {
  const img = await loadImage(src);
  const scale = Math.min(1, WORK / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx, w, h, data: ctx.getImageData(0, 0, w, h) };
}

function toGray(d: Uint8ClampedArray, n: number) {
  const g = new Float32Array(n);
  for (let i = 0; i < n; i++) g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  return g;
}

function laplacianVariance(g: Float32Array, w: number, h: number) {
  let sum = 0,
    sq = 0,
    n = 0;
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w];
      sum += v;
      sq += v * v;
      n++;
    }
  const m = sum / n;
  return sq / n - m * m;
}

function meanStd(g: Float32Array) {
  let s = 0;
  for (const v of g) s += v;
  const m = s / g.length;
  let q = 0;
  for (const v of g) q += (v - m) ** 2;
  return { mean: m, std: Math.sqrt(q / g.length) };
}

function equalize(g: Float32Array) {
  const hist = new Array(256).fill(0);
  for (const v of g) hist[Math.min(255, Math.max(0, Math.round(v)))]++;
  const cdf: number[] = [];
  let acc = 0;
  for (let i = 0; i < 256; i++) cdf[i] = acc += hist[i];
  const min = cdf.find((v) => v > 0) ?? 0;
  const out = new Float32Array(g.length);
  for (let i = 0; i < g.length; i++)
    out[i] = ((cdf[Math.round(Math.min(255, Math.max(0, g[i])))] - min) / Math.max(1, g.length - min)) * 255;
  return out;
}

function grayToDataUrl(g: Float32Array, w: number, h: number, tint?: [number, number, number]) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < g.length; i++) {
    const v = Math.min(255, Math.max(0, g[i]));
    img.data[i * 4] = tint ? (v * tint[0]) / 255 : v;
    img.data[i * 4 + 1] = tint ? (v * tint[1]) / 255 : v;
    img.data[i * 4 + 2] = tint ? (v * tint[2]) / 255 : v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/jpeg", 0.8);
}

function sobel(g: Float32Array, w: number, h: number) {
  const out = new Float32Array(g.length);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = -g[i - w - 1] - 2 * g[i - 1] - g[i + w - 1] + g[i - w + 1] + 2 * g[i + 1] + g[i + w + 1];
      const gy = -g[i - w - 1] - 2 * g[i - w] - g[i - w + 1] + g[i + w - 1] + 2 * g[i + w] + g[i + w + 1];
      out[i] = Math.min(255, Math.hypot(gx, gy));
    }
  return out;
}

function otsu(g: Float32Array) {
  const hist = new Array(256).fill(0);
  for (const v of g) hist[Math.round(Math.min(255, Math.max(0, v)))]++;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0,
    wB = 0,
    best = 0,
    thr = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = g.length - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB,
      mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) {
      best = between;
      thr = t;
    }
  }
  return thr;
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

export interface PhotoAnalysis {
  features: NonNullable<ImageFeatures["photo"]>;
  previews: { mask: string; enhanced: string };
}

export async function analyzePhoto(src: string): Promise<PhotoAnalysis> {
  const { ctx, w, h, data } = await getPixels(src);
  const d = data.data;
  const n = w * h;
  const gray = toGray(d, n);
  let gCount = 0,
    teeth = 0,
    plaque = 0,
    satSum = 0,
    vSum = 0,
    redSum = 0;
  const mask = ctx.createImageData(w, h);
  for (let i = 0; i < n; i++) {
    const r = d[i * 4],
      g = d[i * 4 + 1],
      b = d[i * 4 + 2];
    const { h: hue, s, v } = rgbToHsv(r, g, b);
    const o = i * 4;
    const dim = 0.25;
    mask.data[o] = r * dim;
    mask.data[o + 1] = g * dim;
    mask.data[o + 2] = b * dim;
    mask.data[o + 3] = 255;
    if ((hue >= 330 || hue <= 18) && s > 0.25 && v > 0.25 && v < 0.98) {
      gCount++;
      satSum += s;
      vSum += v;
      redSum += (r - g) / Math.max(1, r + g + b);
      mask.data[o] = 240;
      mask.data[o + 1] = 60 + (1 - s) * 80;
      mask.data[o + 2] = 90;
    } else if (hue > 30 && hue < 62 && s > 0.18 && s < 0.6 && v > 0.45) {
      plaque++;
      mask.data[o] = 250;
      mask.data[o + 1] = 210;
      mask.data[o + 2] = 40;
    } else if (s < 0.22 && v > 0.6) {
      teeth++;
      mask.data[o] = 200;
      mask.data[o + 1] = 230;
      mask.data[o + 2] = 255;
    }
  }
  ctx.putImageData(mask, 0, 0);
  const maskUrl = ctx.canvas.toDataURL("image/jpeg", 0.8);

  const coverage = gCount / n;
  const meanSat = gCount ? satSum / gCount : 0;
  const meanV = gCount ? vSum / gCount : 0;
  const redness = gCount ? redSum / gCount : 0;
  const inflammationScore = Math.min(3, Math.max(0, ((meanSat - 0.32) / 0.33) * 1.8 + ((0.8 - meanV) / 0.35) * 0.8 + (redness - 0.25) * 4));
  const plaqueScore = Math.min(3, Math.max(0, (plaque / Math.max(1, plaque + teeth)) * 7));
  const { mean } = meanStd(gray);
  const sharp = laplacianVariance(gray, w, h);
  const quality: "good" | "acceptable" | "poor" =
    coverage < 0.03 || mean < 45 || mean > 235 || sharp < 15 ? "poor" : sharp < 60 || coverage < 0.08 ? "acceptable" : "good";

  return {
    features: {
      gingivaCoverage: +coverage.toFixed(3),
      rednessIndex: +Math.max(0, Math.min(1, redness * 2)).toFixed(3),
      inflammationScore: +inflammationScore.toFixed(2),
      plaqueScore: +plaqueScore.toFixed(2),
      brightness: Math.round(mean),
      sharpness: Math.round(sharp),
      quality,
    },
    previews: { mask: maskUrl, enhanced: grayToDataUrl(equalize(gray), w, h) },
  };
}

export interface RadiographAnalysis {
  features: NonNullable<ImageFeatures["radiograph"]>;
  previews: { enhanced: string; edges: string };
}

export async function analyzeRadiograph(src: string): Promise<RadiographAnalysis> {
  const { w, h, data } = await getPixels(src);
  const n = w * h;
  const gray = toGray(data.data, n);
  const { mean, std } = meanStd(gray);
  const sharp = laplacianVariance(gray, w, h);
  const eq = equalize(gray);
  const edges = sobel(eq, w, h);
  const thr = otsu(eq);

  // Estimate radiolucency within the central band (interproximal bone region)
  let lucent = 0,
    total = 0;
  const y0 = Math.floor(h * 0.25),
    y1 = Math.floor(h * 0.75),
    x0 = Math.floor(w * 0.15),
    x1 = Math.floor(w * 0.85);
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      total++;
      if (eq[y * w + x] < thr) lucent++;
    }
  const lucentFrac = lucent / Math.max(1, total);
  const estimatedRBL = Math.round(Math.min(80, Math.max(5, (lucentFrac - 0.22) * 110 + 10)));
  const quality: "good" | "acceptable" | "poor" =
    std < 22 || sharp < 10 || mean < 30 || mean > 230 ? "poor" : std < 38 || sharp < 40 ? "acceptable" : "good";

  return {
    features: {
      contrast: Math.round(std),
      sharpness: Math.round(sharp),
      brightness: Math.round(mean),
      estimatedRBL,
      quality,
    },
    previews: {
      enhanced: grayToDataUrl(eq, w, h),
      edges: grayToDataUrl(edges, w, h, [80, 230, 255]),
    },
  };
}
