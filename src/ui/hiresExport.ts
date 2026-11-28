// Hi-res export: renders a flame offscreen, tiled (with padding so the density-estimation
// filter does not seam), into a PNG blob. Shared by the Render tab's "Hi-res PNG" button and
// the batch export queue.
import type { Flame } from '../core/flame';
import type { FlameRenderer } from '../gpu/renderer';

/** Output-size choices: a multiple of the canvas or a fixed 16:9 frame (value `WxH`). */
export const SIZE_OPTIONS: { label: string; value: string }[] = [
  { label: '2×', value: '2' }, { label: '3×', value: '3' }, { label: '4×', value: '4' },
  { label: '1080p', value: '1920x1080' }, { label: '1440p', value: '2560x1440' }, { label: '4K', value: '3840x2160' },
];
export const QUALITY_OPTIONS: { label: string; value: string }[] = [
  { label: 'Draft', value: '25' }, { label: 'Quick', value: '100' }, { label: 'Fast', value: '250' }, { label: 'Good', value: '700' }, { label: 'Ultra', value: '1500' },
];

/** Resolve a SIZE_OPTIONS value against the live canvas size (even dimensions keep encoders happy). */
export function resolveSize(value: string, canvasW: number, canvasH: number): { w: number; h: number } {
  const fixed = /^(\d+)x(\d+)$/.exec(value);
  if (fixed) return { w: Number(fixed[1]), h: Number(fixed[2]) };
  const scale = parseInt(value) || 2;
  return { w: (canvasW * scale) & ~1, h: (canvasH * scale) & ~1 };
}

export const safeFileName = (name: string) => (name || 'wilderfire').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'wilderfire';

export interface HiResOpts {
  w: number; h: number;
  /** plotted samples per pixel */
  spp: number;
  onPlan?: (info: { tileW: number; tileH: number; count: number; maxCells: number; maxSide: number; gpuMaxCells: number }) => void;
  transparent?: boolean;
  /** called after every tile: done/total tiles */
  onTile?: (done: number, total: number) => void;
  /** called while rendering with the overall fraction done (tiles finished + the current tile's progress, 0..1) */
  onProgress?: (frac: number) => void;
  /** set `signal.aborted` to stop after the current tile (an AbortError is thrown) */
  signal?: AbortSignal;
  /** motion curves to embed with the flame in the PNG */
  curves?: import('../core/motion').MotionCurve[];
  /** the timeline for a flame with motion blur (sub-frames around `t`); single-tile renders only */
  motionBlur?: import('./motionBlur').MotionBlurCtx;
}

/**
 * Render `flame` at w×h and return the PNG. The renderer must already be in export mode
 * (`renderer.exporting = true`, restored by the caller together with `setFlame(app.flame)`);
 * this sets the flame on the renderer, so it compiles the kernel for it.
 */
/** Tile size for a w×h export on this device: the whole image when it fits the GPU's budget (the usual case up to
 *  8K — one render, no seams to hide), else the largest square tiles that fit with their apron. */
export function planTiles(w: number, h: number, lim: { maxCells: number; maxSide: number }, pad: number): { tile: number; tilesX: number; tilesY: number } {
  const whole = w <= lim.maxSide && h <= lim.maxSide && w * h <= lim.maxCells;
  if (whole) return { tile: Math.max(w, h), tilesX: 1, tilesY: 1 };
  const side = Math.max(256, Math.min(lim.maxSide, Math.floor(Math.sqrt(lim.maxCells))) - 2 * pad);
  return { tile: side, tilesX: Math.ceil(w / side), tilesY: Math.ceil(h / side) };
}

/** Minimize full-image sampling repetitions, including padded allocation limits. */
export function planRectTiles(w: number, h: number, lim: { maxCells: number; maxSide: number }, pad: number) {
  if (w <= lim.maxSide && h <= lim.maxSide && w*h <= lim.maxCells)
    return { tileW: w, tileH: h, tilesX: 1, tilesY: 1 };
  const maxW = Math.min(w, lim.maxSide - 2*pad, Math.floor(lim.maxCells/(1+2*pad))-2*pad);
  let best: { tileW: number; tileH: number; tilesX: number; tilesY: number } | undefined;
  let bestCount = Infinity, bestArea = Infinity;
  for (let tw = 1; tw <= maxW; tw++) {
    const th = Math.min(h, lim.maxSide-2*pad, Math.floor(lim.maxCells/(tw+2*pad))-2*pad);
    if (th < 1) continue;
    const nx = Math.ceil(w/tw), ny = Math.ceil(h/th);
    const bw = Math.ceil(w/nx), bh = Math.ceil(h/ny);
    const area = (bw+2*pad)*(bh+2*pad);
    if (nx*ny < bestCount || (nx*ny === bestCount && area < bestArea)) {
      best = { tileW: bw, tileH: bh, tilesX: nx, tilesY: ny };
      bestCount = nx*ny; bestArea = area;
    }
  }
  if (!best) throw new Error('GPU tile budget too small');
  return best;
}

export async function renderHiRes(renderer: FlameRenderer, flame: Flame, o: HiResOpts): Promise<Blob> {
  const PAD = 8;
  const { w: fullW, h: fullH } = o;
  renderer.setFlame(flame);
  const out = document.createElement('canvas');
  out.width = fullW;
  out.height = fullH;
  const ctx = out.getContext('2d')!;
  const limits = renderer.exportTileLimit();
  const budget = limits;
  const plan = planRectTiles(fullW, fullH, budget, PAD);
  const { tileW, tileH, tilesX, tilesY } = plan;
  o.onPlan?.({ tileW, tileH, count: tilesX*tilesY, ...budget, gpuMaxCells: limits.maxCells });
  const single = tilesX === 1 && tilesY === 1;
  let n = 0;
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      if (o.signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
      const x0 = tx * tileW, y0 = ty * tileH;
      const tw = Math.min(tileW, fullW - x0);
      const th = Math.min(tileH, fullH - y0);
      // Render with padding so the DE filter doesn't seam at tile edges (none needed for a single tile).
      const pad = single ? 0 : PAD;
      const pw = tw + 2 * pad, ph = th + 2 * pad;
      const tiles = tilesX * tilesY, tileIdx = n;
      const px = single && o.motionBlur && flame.motionBlur
        ? await (await import('./motionBlur')).renderMotionBlurred(renderer, flame, o.motionBlur, fullW, fullH, o.spp, o.transparent)
        : await renderer.renderRegion({
          fullW, fullH, tileX: x0 - pad, tileY: y0 - pad,
          tileW: pw, tileH: ph, spp: o.spp, transparent: o.transparent, signal: o.signal,
          onProgress: o.onProgress && ((f) => o.onProgress!((tileIdx + f) / tiles)),
        });
      const img = single ? new ImageData(px, tw, th) : new ImageData(tw, th);
      if (!single) {
        for (let y = 0; y < th; y++) {
          const srcOff = ((y + pad) * pw + pad) * 4;
          img.data.set(px.subarray(srcOff, srcOff + tw * 4), y * tw * 4);
        }
      }
      ctx.putImageData(img, x0, y0);
      n++;
      o.onTile?.(n, tilesX * tilesY);
    }
  }
  const blob = await new Promise<Blob | null>((res) => out.toBlob(res, 'image/png'));
  if (!blob) throw new Error('PNG encoding failed');
  // the flame travels inside the PNG (flam3_genome tEXt chunk) — drop the file on the canvas to get it back
  const { pngWithFlame } = await import('../core/pngMeta');
  return pngWithFlame(blob, flame, o.curves ?? []);
}
