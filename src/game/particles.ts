// Tiny particle engine for battle impact sparks. One canvas overlay on the
// arena; the FX layer calls `burst()` at a normalised point. The rAF loop
// runs only while particles are alive.

import { motionOff } from "./settings";

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  gravity: number;
}

let cv: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let parts: P[] = [];
let raf = 0;
let last = 0;

export function attach(canvas: HTMLCanvasElement | null) {
  cv = canvas;
  ctx = canvas ? canvas.getContext("2d") : null;
  parts = [];
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

function resize() {
  if (!cv) return;
  const r = cv.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(r.width * dpr));
  const h = Math.max(1, Math.round(r.height * dpr));
  if (cv.width !== w || cv.height !== h) {
    cv.width = w;
    cv.height = h;
  }
}

function tick(now: number) {
  raf = 0;
  if (!ctx || !cv) return;
  const dt = Math.min(48, now - last || 16);
  last = now;
  ctx.clearRect(0, 0, cv.width, cv.height);
  parts = parts.filter((p) => {
    p.life -= dt;
    if (p.life <= 0) return false;
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const a = Math.max(0, p.life / p.max);
    ctx!.globalAlpha = a;
    ctx!.fillStyle = p.color;
    const s = p.size * (0.4 + a * 0.6);
    ctx!.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    return true;
  });
  ctx.globalAlpha = 1;
  if (parts.length) raf = requestAnimationFrame(tick);
}

interface BurstOpts {
  count?: number;
  colors?: string[];
  speed?: number;
  spread?: number; // radians; default full circle
  angle?: number; // centre direction
  gravity?: number;
  size?: number;
  life?: number;
}

export function burst(nx: number, ny: number, opts: BurstOpts = {}) {
  if (!cv || !ctx || motionOff()) return;
  resize();
  const {
    count = 14,
    colors = ["#fff", "#f2b134", "#ff5d4d"],
    speed = 0.32,
    spread = Math.PI * 2,
    angle = -Math.PI / 2,
    gravity = 0.0011,
    size = 3,
    life = 480,
  } = opts;
  const dpr = cv.width / cv.getBoundingClientRect().width || 1;
  const x = nx * cv.width;
  const y = ny * cv.height;
  for (let i = 0; i < count; i++) {
    const a = angle + (Math.random() - 0.5) * spread;
    const v = speed * (0.35 + Math.random()) * dpr;
    const l = life * (0.6 + Math.random() * 0.7);
    parts.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: l,
      max: l,
      size: (size + Math.random() * size) * dpr,
      color: colors[(Math.random() * colors.length) | 0],
      gravity: gravity * dpr,
    });
  }
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
}
