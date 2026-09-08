// Town-hub art: the crest on the title screen, the night sky behind the
// village, and the campfire. Ported from the v1 build.

import { px, seg, ell } from "./pixels";

type G = CanvasRenderingContext2D;

export function drawCrest(cv: HTMLCanvasElement) {
  const g = cv.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  const P = ["#9a6c1a", "#f2b134", "#e9c877", "#1b1622"];
  g.clearRect(0, 0, cv.width, cv.height);
  const s = Math.max(2, Math.floor(cv.width / 15));
  const shape = [
    "  X      X  ",
    " XXX    XXX ",
    " XXXXXXXXXX ",
    "  XXXXXXXX  ",
    "   XXXXXX   ",
    "    XXXX    ",
    "     XX     ",
    "    XXXX    ",
    "   XXXXXX   ",
    "  XXXXXXXX  ",
  ];
  shape.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === "X") {
        g.fillStyle = y < 2 || x < 3 || x > 7 ? P[1] : P[2];
        g.fillRect(x * s + 3, y * s + 4, s, s);
      }
    });
  });
}

export function drawSky(cv: HTMLCanvasElement) {
  const g = cv.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  const W = cv.width,
    H = cv.height;
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "#151020");
  gr.addColorStop(0.55, "#241c33");
  gr.addColorStop(1, "#3a2c43");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    const x = (i * 41 + ((i * i) % 29)) % W,
      y = (i * 23 + (i % 9) * 7) % Math.round(H * 0.72);
    px(g, x, y, 1, 1, i % 6 === 0 ? "#fff8dc" : "#9d92b4");
  }
  g.save();
  g.shadowColor = "#ffeab8";
  g.shadowBlur = 12;
  ell(g, Math.round(W * 0.78), Math.round(H * 0.24), 9, 9, "#f6e6bd");
  g.restore();
  ell(g, Math.round(W * 0.815), Math.round(H * 0.205), 7, 7, "#241c33");
  const base = H - 1;
  const casas: [number, number, number][] = [
    [4, 13, 11],
    [19, 19, 15],
    [41, 12, 9],
    [56, 22, 17],
    [81, 15, 11],
    [99, 25, 19],
    [127, 13, 9],
    [143, 17, 13],
  ];
  casas.forEach(([x, w, h]) => {
    px(g, x, base - h, w, h, "#191426");
    for (let i = 0; i < w; i++)
      px(g, x + i, base - h - Math.round(Math.min(i, w - 1 - i) * 0.9), 1, 1, "#191426");
    if ((x + w) % 3 === 0)
      px(g, x + Math.floor(w / 2), base - Math.round(h * 0.6), 1, 1, "#e0a53a");
  });
  px(g, 0, base, W, 1, "#141021");
}

let _fireF = 0;
export function drawFire(cv: HTMLCanvasElement) {
  const g: G = cv.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  const W = cv.width,
    H = cv.height;
  g.clearRect(0, 0, W, H);
  const f = _fireF++;
  const wob = (k: number) => Math.sin((f + k) * 0.9);
  px(g, 4, H - 6, W - 8, 3, "#3a2a18");
  seg(g, 5, H - 4, W - 6, H - 8, "#5b3a22", 2);
  seg(g, W - 6, H - 4, 5, H - 8, "#4a3420", 2);
  px(g, 9, H - 7, W - 18, 2, "#c9531f");
  const base = H - 7;
  for (let i = 0; i < 3; i++) {
    const col = ["#e0531f", "#f2a028", "#ffe08a"][i];
    const w = [13, 9, 5][i] + Math.round(wob(i * 2) * 1.2);
    const h = [15, 11, 7][i] + Math.round(wob(i * 3 + 1) * 2);
    const x = Math.round(W / 2 - w / 2 + wob(i * 5) * 1.1);
    for (let y = 0; y < h; y++) {
      const t = y / h,
        ww = Math.max(1, Math.round(w * (1 - t * t)));
      px(g, Math.round(x + (w - ww) / 2 + wob(y + i) * 0.8), base - y, ww, 1, col);
    }
  }
  if (f % 5 === 0)
    px(g, Math.round(W / 2 + wob(f) * 4), base - 18 - (f % 4), 1, 1, "#ffd27a");
}
