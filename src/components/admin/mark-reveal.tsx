"use client";

import { ImageUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Reveals the hidden marks in a screenshot or photo, in the browser: nothing
 * is uploaded. Each pixel's brightness is compared with its neighbourhood's
 * average and the difference is multiplied, so text at 3% opacity on a flat
 * background turns black-on-white while the page itself fades to grey.
 */
export function MarkReveal() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [gain, setGain] = useState(45);
  const canvas = useRef<HTMLCanvasElement>(null);

  const open = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  useEffect(() => {
    const out = canvas.current;
    if (!image || !out) return;
    const scale = Math.min(1, 2400 / image.naturalWidth);
    const w = Math.round(image.naturalWidth * scale);
    const h = Math.round(image.naturalHeight * scale);
    out.width = w;
    out.height = h;
    const ctx = out.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // The neighbourhood average: shrink a lot, then stretch back with smoothing.
    const blur = document.createElement("canvas");
    const sw = Math.max(1, Math.round(w / 14));
    const sh = Math.max(1, Math.round(h / 14));
    blur.width = sw;
    blur.height = sh;
    const b = blur.getContext("2d")!;
    b.imageSmoothingQuality = "high";
    b.drawImage(image, 0, 0, sw, sh);

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(blur, 0, 0, w, h);
    const mean = ctx.getImageData(0, 0, w, h).data;
    ctx.drawImage(image, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h);
    const d = px.data;
    for (let i = 0; i < d.length; i += 4) {
      const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const m = 0.299 * mean[i] + 0.587 * mean[i + 1] + 0.114 * mean[i + 2];
      // Brighter than around it (the mark on a dark theme) or darker (on a light one): both show as dark.
      const v = 255 - Math.min(255, Math.abs(y - m) * gain);
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(px, 0, 0);
  }, [image, gain]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-fg hover:bg-surface-2">
          <ImageUp className="h-4 w-4" aria-hidden />
          בחירת צילום מסך או תמונה
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => open(e.target.files?.[0])} />
        </label>
        {image && (
          <label className="flex items-center gap-3 text-sm text-muted">
            עוצמה
            <input type="range" min={10} max={120} value={gain} onChange={(e) => setGain(Number(e.target.value))} />
          </label>
        )}
      </div>
      {image ? (
        <canvas ref={canvas} className="w-full rounded-xl border border-line bg-white" />
      ) : (
        <p className="text-sm text-muted">הקובץ נשאר במחשב שלך. אחרי הבחירה, הקוד יופיע כטקסט כהה באחד מארבעת המקומות.</p>
      )}
    </div>
  );
}
