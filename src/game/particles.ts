// Battle impact FX. One canvas overlay on the arena; the FX layer calls
// `burst()` at a normalised point. The rAF loop runs only while particles
// are alive. Two shapes: shards (physical — elongated, fly along an axis
// and tumble) and motes (magic — round, glow, drift).

import { motionOff } from "./settings";

type Shape = "shard" | "mote";

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
  drag: number;
  shape: Shape;
  rot: number;
  vrot: number;
  glow: number;
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
  ctx.globalCompositeOperation = "lighter";
  parts = parts.filter((p) => {
    p.life -= dt;
    if (p.life <= 0) return false;
    p.vx *= p.drag;
    p.vy = p.vy * p.drag + p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vrot * dt;
    const a = Math.max(0, p.life / p.max);
    ctx!.globalAlpha = a;
    ctx!.fillStyle = p.color;
    ctx!.shadowColor = p.color;
    ctx!.shadowBlur = p.glow * (0.4 + a * 0.6);
    if (p.shape === "mote") {
      const s = p.size * (0.5 + a * 0.5);
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, s, 0, 7);
      ctx!.fill();
    } else {
      const len = p.size * (2.4 + a * 1.4);
      const wid = p.size * (0.5 + a * 0.4);
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.fillRect(-len / 2, -wid / 2, len, wid);
      ctx!.restore();
    }
    return true;
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "source-over";
  if (parts.length) raf = requestAnimationFrame(tick);
}

interface BurstOpts {
  count?: number;
  colors?: string[];
  speed?: number;
  spread?: number; // radians around `angle`
  angle?: number; // centre direction (rad); default straight up
  gravity?: number;
  size?: number;
  life?: number;
  shape?: Shape;
  glow?: number;
}

export function burst(nx: number, ny: number, opts: BurstOpts = {}) {
  if (!cv || !ctx || motionOff()) return;
  resize();
  const {
    count = 14,
    colors = ["#fff", "#f2b134", "#ff5d4d"],
    speed = 0.34,
    spread = Math.PI * 1.6,
    angle = -Math.PI / 2,
    gravity = 0.0011,
    size = 3,
    life = 460,
    shape = "shard",
    glow = 8,
  } = opts;
  const dpr = cv.width / cv.getBoundingClientRect().width || 1;
  const x = nx * cv.width;
  const y = ny * cv.height;
  for (let i = 0; i < count; i++) {
    const a = angle + (Math.random() - 0.5) * spread;
    const v = speed * (0.4 + Math.random()) * dpr;
    const l = life * (0.55 + Math.random() * 0.7);
    parts.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: l,
      max: l,
      size: (size + Math.random() * size) * dpr,
      color: colors[(Math.random() * colors.length) | 0],
      gravity: gravity * dpr * (shape === "mote" ? 0.25 : 1),
      drag: shape === "mote" ? 0.965 : 0.99,
      shape,
      rot: Math.random() * 7,
      vrot: (Math.random() - 0.5) * 0.03,
      glow: glow * dpr,
    });
  }
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
}

// a quick radial ring — used for the crit pop on the impact point
export function ring(nx: number, ny: number, color: string) {
  if (!cv || !ctx || motionOff()) return;
  resize();
  const dpr = cv.width / cv.getBoundingClientRect().width || 1;
  burst(nx, ny, {
    count: 18,
    colors: [color, "#fff"],
    speed: 0.6,
    spread: Math.PI * 2,
    gravity: 0,
    size: 2.5,
    life: 340,
    shape: "shard",
    glow: 10 * dpr,
  });
}
