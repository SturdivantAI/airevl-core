"use client";

/**
 * BackgroundCanvas — AiRevl living background (Option B v2, approved winner).
 * Procedural starfield + full-base undulating wireframe terrain, Canvas 2D.
 * Replaces ShaderBackground (WebGL fragment shader).
 *
 * Spec of record: DESIGN_ADDENDUM_BACKGROUND.md ("Living Background").
 * Palette adapted to the site system (globals.css): cyan primary on deep navy.
 *
 * Approved motion (2026-07-18): deep per-star twinkle with size pulse and
 * glint flares; wave coverage across the whole base (no flat centre valley);
 * subtle cursor parallax; calm-ambient speeds.
 *
 * Perf/a11y budget: DPR capped 1.5, rAF paused on tab blur,
 * prefers-reduced-motion renders a single static frame, aria-hidden.
 */

import { useEffect, useRef } from "react";

export interface BackgroundCanvasProps {
  /** Vertical fraction of viewport where the horizon sits. Default 0.50 */
  horizon?: number;
  /** Number of twinkle stars. Default 150 */
  starCount?: number;
  /** Global motion multiplier; 1 = calm ambient (approved). */
  intensity?: number;
  /** Cap on devicePixelRatio for perf. Default 1.5 */
  maxDpr?: number;
}

const ROWS = 46;
const COLS = 64;
const Z_NEAR = 0.75;
const Z_FAR = 13.0;
const SPAN = 30;
const HALO_COUNT = 8;
const NODE_COUNT = 11;

// Site palette (globals.css): primary #00f0ff / #00dbe9 on #050508–#051424
const LINE = (a: number) => `rgba(0,219,233,${a})`;
const STAR = (a: number) => `rgba(210,250,252,${a})`;
const BG_TOP = "#051424";
const BG_MID = "#040e1a";
const BG_BOTTOM = "#050508";
const VIGNETTE = (a: number) => `rgba(5,5,8,${a})`;

interface Star { x: number; y: number; r: number; sp: number; ph: number; halo: boolean }
interface GlowNode { j: number; i: number; sp: number; ph: number }

export default function BackgroundCanvas({
  horizon = 0.5,
  starCount = 150,
  intensity = 1,
  maxDpr = 1.5,
}: BackgroundCanvasProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DPR = Math.min(devicePixelRatio || 1, maxDpr);
    let W = 0, H = 0, running = true, raf = 0;
    let mx = 0, my = 0, pmx = 0, pmy = 0;

    const stars: Star[] = Array.from({ length: starCount }, (_, i) => ({
      x: Math.random(), y: Math.random() * 0.5,
      r: 0.5 + Math.random() * 1.2,
      sp: (0.7 + Math.random() * 1.3) * intensity,
      ph: Math.random() * Math.PI * 2,
      halo: i < HALO_COUNT,
    }));
    const nodes: GlowNode[] = Array.from({ length: NODE_COUNT }, () => ({
      j: Math.floor(Math.random() * COLS),
      i: 4 + Math.floor(Math.random() * (ROWS - 10)),
      sp: 0.3 + Math.random() * 0.7,
      ph: Math.random() * Math.PI * 2,
    }));

    const wave = (x: number, z: number, t: number) =>
      0.5 * Math.sin(0.55 * x + 0.45 * t + 1.6 * z) +
      0.32 * Math.sin(1.3 * x - 0.28 * t + 0.8 * z) +
      0.22 * Math.sin(2.1 * z + 0.6 * t + 0.3 * x) +
      0.28 * Math.sin(0.15 * t + 0.9 * z);

    const envelope = (xn: number, zi: number) =>
      (0.85 + Math.pow(Math.abs(xn), 2.1) * 2.2) * (0.55 + 0.45 * zi);

    const project = (j: number, i: number, t: number): [number, number] => {
      const zt = i / ROWS;
      const z = Z_NEAR * Math.pow(Z_FAR / Z_NEAR, zt);
      const xn = (j / COLS - 0.5) * 2;
      const xw = xn * SPAN * 0.5;
      const h = envelope(xn, 1 - zt) * wave(xw, z, t * intensity);
      const hy = H * horizon + pmy;
      const K = H * 0.85;
      return [
        W / 2 + pmx + (xw * K * 0.14) / z,
        hy + (K * 0.45) / z - (h * K * 0.07) / z,
      ];
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, BG_TOP); g.addColorStop(0.55, BG_MID); g.addColorStop(1, BG_BOTTOM);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      for (const s of stars) {
        const tw = Math.pow(Math.sin(t * s.sp + s.ph), 2);
        const x = s.x * W, y = s.y * H;
        ctx.beginPath();
        ctx.arc(x, y, s.r * (0.65 + 0.55 * tw), 0, 6.2832);
        ctx.fillStyle = STAR(0.15 + 0.85 * tw);
        ctx.fill();
        if (s.halo) {
          ctx.beginPath();
          ctx.arc(x, y, 4 + 6 * tw, 0, 6.2832);
          ctx.strokeStyle = LINE(0.08 + 0.28 * tw);
          ctx.lineWidth = 1; ctx.stroke();
          if (tw > 0.88) {
            const fl = (tw - 0.88) / 0.12, L = 5 + 6 * fl;
            ctx.strokeStyle = STAR(0.5 * fl); ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(x - L, y); ctx.lineTo(x + L, y);
            ctx.moveTo(x, y - L); ctx.lineTo(x, y + L);
            ctx.stroke();
          }
        }
      }

      ctx.lineWidth = 1;
      const pts: [number, number][][] = [];
      for (let i = 0; i <= ROWS; i++) {
        pts[i] = [];
        for (let j = 0; j <= COLS; j++) pts[i][j] = project(j, i, t);
      }
      for (let i = 0; i <= ROWS; i++) {
        ctx.strokeStyle = LINE(0.045 + 0.42 * Math.pow(1 - i / ROWS, 1.6));
        ctx.beginPath();
        for (let j = 0; j <= COLS; j++) {
          const [x, y] = pts[i][j];
          if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let i = 0; i < ROWS; i++) {
        ctx.strokeStyle = LINE(0.035 + 0.3 * Math.pow(1 - i / ROWS, 1.6));
        ctx.beginPath();
        for (let j = 0; j <= COLS; j++) {
          const [x1, y1] = pts[i][j], [x2, y2] = pts[i + 1][j];
          ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        }
        ctx.stroke();
      }

      for (const n of nodes) {
        const [x, y] = pts[n.i][n.j];
        const pulse = 0.4 + 0.6 * Math.pow(Math.sin(t * n.sp + n.ph), 2);
        const rg = ctx.createRadialGradient(x, y, 0, x, y, 7);
        rg.addColorStop(0, STAR(0.75 * pulse)); rg.addColorStop(1, STAR(0));
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.2832); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 6.2832);
        ctx.fillStyle = STAR(0.85 * pulse); ctx.fill();
      }

      const v = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.5, H * 0.95);
      v.addColorStop(0, VIGNETTE(0)); v.addColorStop(1, VIGNETTE(0.55));
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    };

    let t0 = performance.now();
    const frame = (now: number) => {
      if (!running) return;
      pmx += (mx - pmx) * 0.04; pmy += (my - pmy) * 0.04;
      draw((now - t0) / 1000);
      raf = requestAnimationFrame(frame);
    };
    const resize = () => {
      W = innerWidth; H = innerHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (reduced) draw(12.5);
    };
    const onMouse = (e: MouseEvent) => {
      mx = (e.clientX / W - 0.5) * 26; my = (e.clientY / H - 0.5) * 12;
    };
    const onVis = () => {
      running = !document.hidden && !reduced;
      if (running) { t0 = performance.now() - 1; raf = requestAnimationFrame(frame); }
    };

    addEventListener("resize", resize);
    addEventListener("mousemove", onMouse);
    document.addEventListener("visibilitychange", onVis);
    resize();
    if (!reduced) raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("mousemove", onMouse);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [horizon, starCount, intensity, maxDpr]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 block"
    />
  );
}
