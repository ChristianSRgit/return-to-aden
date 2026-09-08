// Pixel-art engine. The l2api.dev data has no monster or hero art, so every
// creature and every piece of gear is hand-built here from pixel primitives,
// modelled on how the real Interlude sprite looks. Ported verbatim from the
// v1 single-file build.

import type { ClassKey, SpriteKey } from "../data";

type G = CanvasRenderingContext2D;

export function px(g: G, x: number, y: number, w: number, h: number, c: string) {
  g.fillStyle = c;
  g.fillRect(x | 0, y | 0, Math.max(1, w | 0), Math.max(1, h | 0));
}
export function seg(
  g: G,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  c: string,
  t = 1,
) {
  const dx = x1 - x0,
    dy = y1 - y0,
    n = Math.max(Math.abs(dx), Math.abs(dy)) || 1;
  for (let i = 0; i <= n; i++)
    px(g, Math.round(x0 + (dx * i) / n), Math.round(y0 + (dy * i) / n), t, t, c);
}
export function ell(
  g: G,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  c: string,
) {
  g.fillStyle = c;
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, 7);
  g.fill();
}
export function makeCv(w: number, h: number): [HTMLCanvasElement, G] {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  return [cv, g];
}

// ── monster painters ───────────────────────────────────────────────
export const BEASTS: Record<string, (dark?: boolean) => HTMLCanvasElement> = {
  gremlin() {
    const [cv, g] = makeCv(40, 38);
    const S = "#5f8f42",
      D = "#3c6127",
      L = "#8ac25a",
      E = "#ffd23d",
      P = "#16160e";
    px(g, 3, 10, 5, 7, D);
    px(g, 6, 8, 5, 10, S);
    px(g, 10, 9, 3, 7, L);
    px(g, 32, 10, 5, 7, D);
    px(g, 29, 8, 5, 10, S);
    px(g, 27, 9, 3, 7, L);
    px(g, 12, 4, 16, 14, S);
    px(g, 13, 5, 14, 2, L);
    px(g, 14, 16, 12, 4, S);
    px(g, 14, 10, 4, 4, E);
    px(g, 15, 11, 2, 2, P);
    px(g, 22, 10, 4, 4, E);
    px(g, 23, 11, 2, 2, P);
    px(g, 16, 16, 8, 2, P);
    px(g, 17, 18, 2, 2, L);
    px(g, 21, 18, 2, 2, L);
    px(g, 15, 20, 10, 9, S);
    px(g, 16, 22, 8, 6, L);
    px(g, 9, 20, 5, 3, S);
    px(g, 8, 22, 4, 7, S);
    px(g, 26, 20, 5, 3, S);
    px(g, 28, 22, 4, 7, S);
    px(g, 14, 29, 4, 6, S);
    px(g, 13, 34, 5, 2, D);
    px(g, 22, 29, 4, 6, S);
    px(g, 21, 34, 5, 2, D);
    return cv;
  },
  wolf(dark) {
    const [cv, g] = makeCv(46, 38);
    const B = dark ? "#4c414f" : "#77777f",
      D = dark ? "#2f2637" : "#4b4b54",
      L = dark ? "#6a5c70" : "#9a9aa4",
      E = dark ? "#ff4030" : "#ecd457";
    px(g, 6, 16, 13, 13, D);
    px(g, 7, 22, 9, 7, D);
    px(g, 10, 17, 20, 10, B);
    px(g, 11, 23, 18, 4, D);
    px(g, 1, 13, 7, 4, B);
    px(g, 0, 15, 4, 3, L);
    px(g, 27, 16, 9, 10, B);
    px(g, 30, 12, 8, 9, B);
    px(g, 36, 17, 7, 4, B);
    px(g, 42, 18, 2, 2, D);
    px(g, 30, 7, 3, 7, D);
    px(g, 32, 6, 3, 6, B);
    px(g, 34, 15, 2, 2, E);
    px(g, 11, 17, 17, 2, L);
    px(g, 31, 12, 6, 2, L);
    if (dark) px(g, 27, 10, 5, 10, D);
    seg(g, 32, 26, 33, 36, D, 2);
    seg(g, 27, 26, 28, 36, D, 2);
    seg(g, 15, 26, 13, 36, B, 2);
    seg(g, 20, 26, 19, 36, B, 2);
    px(g, 32, 35, 4, 2, D);
    px(g, 26, 35, 4, 2, D);
    px(g, 11, 35, 4, 2, B);
    px(g, 17, 35, 4, 2, B);
    return cv;
  },
  goblin() {
    const [cv, g] = makeCv(42, 40);
    const S = "#7c9a46",
      D = "#4f672c",
      L = "#a3c169",
      C = "#6b4a2b",
      CL = "#8a6a3b",
      E = "#ff5a4a";
    px(g, 8, 7, 5, 3, D);
    px(g, 29, 7, 5, 3, D);
    px(g, 14, 4, 13, 11, S);
    px(g, 14, 8, 13, 2, D);
    px(g, 17, 9, 2, 2, E);
    px(g, 23, 9, 2, 2, E);
    px(g, 19, 10, 3, 4, D);
    px(g, 13, 15, 15, 11, S);
    px(g, 14, 18, 13, 2, D);
    px(g, 15, 15, 10, 2, L);
    px(g, 13, 24, 15, 5, C);
    px(g, 9, 16, 4, 10, S);
    px(g, 27, 16, 4, 8, S);
    px(g, 30, 4, 3, 20, C);
    px(g, 28, 2, 7, 5, CL);
    px(g, 27, 3, 2, 2, CL);
    px(g, 34, 4, 2, 2, CL);
    px(g, 14, 29, 4, 8, S);
    px(g, 13, 36, 5, 2, D);
    px(g, 22, 29, 4, 8, S);
    px(g, 21, 36, 5, 2, D);
    return cv;
  },
  orc() {
    const [cv, g] = makeCv(48, 46);
    const S = "#71753c",
      D = "#4a4c24",
      L = "#93975a",
      C = "#5c3a22",
      T = "#e8e0c8",
      M = "#9aa0a8",
      MD = "#5f636b",
      H = "#5b3a22",
      E = "#d84030";
    px(g, 15, 4, 14, 12, S);
    px(g, 15, 8, 14, 3, D);
    px(g, 18, 10, 2, 2, E);
    px(g, 25, 10, 2, 2, E);
    px(g, 16, 14, 13, 3, S);
    px(g, 17, 13, 2, 3, T);
    px(g, 26, 13, 2, 3, T);
    px(g, 7, 15, 32, 6, S);
    px(g, 16, 13, 13, 3, S);
    px(g, 12, 19, 20, 13, S);
    px(g, 13, 24, 18, 2, D);
    px(g, 15, 19, 14, 2, L);
    px(g, 12, 29, 22, 2, H);
    px(g, 13, 31, 20, 6, C);
    px(g, 5, 17, 7, 16, S);
    px(g, 4, 31, 8, 4, S);
    px(g, 33, 15, 7, 11, S);
    seg(g, 37, 22, 44, 7, H, 3);
    px(g, 33, 2, 14, 10, M);
    px(g, 33, 2, 14, 3, MD);
    px(g, 45, 4, 3, 10, M);
    px(g, 15, 36, 5, 8, S);
    px(g, 14, 43, 6, 2, D);
    px(g, 27, 36, 5, 8, S);
    px(g, 26, 43, 6, 2, D);
    return cv;
  },
  skeleton() {
    const [cv, g] = makeCv(42, 42);
    const B = "#dcd6bc",
      D = "#9a9276",
      O = "#48442f",
      M = "#6b6b74",
      ML = "#9a9aa4",
      H = "#5b3a22";
    px(g, 15, 3, 10, 9, B);
    px(g, 16, 11, 8, 3, B);
    px(g, 16, 6, 3, 3, O);
    px(g, 21, 6, 3, 3, O);
    px(g, 19, 9, 2, 2, O);
    px(g, 12, 14, 16, 2, B);
    px(g, 19, 14, 2, 11, B);
    px(g, 13, 16, 14, 2, D);
    px(g, 13, 19, 14, 2, D);
    px(g, 14, 22, 12, 2, D);
    px(g, 14, 25, 12, 2, D);
    px(g, 15, 26, 10, 4, B);
    seg(g, 11, 16, 9, 24, B, 2);
    seg(g, 28, 15, 30, 23, B, 2);
    seg(g, 9, 24, 7, 31, B, 2);
    seg(g, 30, 23, 31, 31, B, 2);
    px(g, 30, 2, 3, 21, ML);
    px(g, 32, 2, 1, 20, M);
    px(g, 27, 21, 9, 2, M);
    px(g, 30, 23, 3, 4, H);
    px(g, 3, 23, 10, 10, M);
    px(g, 4, 24, 8, 8, ML);
    px(g, 7, 27, 3, 3, M);
    seg(g, 16, 29, 15, 36, B, 2);
    seg(g, 24, 29, 25, 36, B, 2);
    seg(g, 15, 36, 14, 41, B, 2);
    seg(g, 25, 36, 26, 41, B, 2);
    px(g, 12, 40, 5, 2, D);
    px(g, 24, 40, 5, 2, D);
    return cv;
  },
  spider() {
    const [cv, g] = makeCv(48, 40);
    const B = "#4a2f24",
      D = "#2b1a14",
      L = "#6e4a38",
      MK = "#c0763f",
      E = "#b6ff5a",
      F = "#d8d2b8";
    for (const s of [-1, 1]) {
      const ox = 24;
      seg(g, ox + s * 4, 15, ox + s * 20, 3, D, 2);
      seg(g, ox + s * 20, 3, ox + s * 24, 10, D, 2);
      seg(g, ox + s * 5, 18, ox + s * 21, 12, D, 2);
      seg(g, ox + s * 21, 12, ox + s * 25, 18, D, 2);
      seg(g, ox + s * 5, 21, ox + s * 21, 22, D, 2);
      seg(g, ox + s * 21, 22, ox + s * 25, 28, D, 2);
      seg(g, ox + s * 4, 24, ox + s * 17, 31, D, 2);
      seg(g, ox + s * 17, 31, ox + s * 21, 37, D, 2);
    }
    ell(g, 24, 24, 11, 9, B);
    ell(g, 24, 26, 10, 7, D);
    px(g, 18, 18, 12, 4, L);
    px(g, 21, 20, 6, 2, MK);
    px(g, 22, 23, 4, 2, MK);
    px(g, 21, 26, 6, 2, MK);
    px(g, 18, 12, 12, 8, B);
    px(g, 19, 13, 10, 2, L);
    px(g, 19, 14, 2, 2, E);
    px(g, 21, 14, 2, 2, E);
    px(g, 24, 14, 2, 2, E);
    px(g, 26, 14, 2, 2, E);
    px(g, 20, 19, 2, 3, F);
    px(g, 26, 19, 2, 3, F);
    return cv;
  },
  hangman() {
    const [cv, g] = makeCv(56, 52);
    const BK = "#4a3420",
      BD = "#2c1d10",
      BL = "#6b4a2b",
      LF = "#3c5a26",
      LD = "#223c16",
      LL = "#557f34",
      E = "#ffb020",
      MO = "#140d06",
      R = "#b7a678";
    px(g, 6, 4, 44, 15, LD);
    px(g, 10, 2, 32, 14, LF);
    px(g, 14, 0, 11, 7, LL);
    px(g, 32, 2, 12, 6, LL);
    px(g, 8, 15, 40, 4, LD);
    px(g, 2, 10, 10, 3, BK);
    px(g, 2, 10, 3, 8, BK);
    px(g, 46, 8, 10, 3, BK);
    px(g, 52, 8, 3, 10, BK);
    px(g, 20, 17, 15, 27, BK);
    px(g, 14, 39, 27, 6, BK);
    px(g, 10, 43, 7, 4, BD);
    px(g, 39, 43, 7, 4, BD);
    px(g, 17, 45, 4, 3, BD);
    px(g, 35, 45, 4, 3, BD);
    px(g, 20, 17, 3, 26, BL);
    px(g, 23, 20, 2, 21, BD);
    px(g, 30, 19, 2, 23, BD);
    px(g, 20, 23, 6, 2, BD);
    px(g, 29, 23, 6, 2, BD);
    g.save();
    g.shadowColor = E;
    g.shadowBlur = 8;
    px(g, 21, 25, 4, 4, E);
    px(g, 30, 25, 4, 4, E);
    g.restore();
    px(g, 22, 26, 2, 2, MO);
    px(g, 31, 26, 2, 2, MO);
    px(g, 21, 32, 13, 4, MO);
    px(g, 23, 32, 2, 2, BL);
    px(g, 27, 35, 2, 2, BL);
    px(g, 31, 32, 2, 2, BL);
    seg(g, 12, 16, 12, 30, R, 1);
    px(g, 10, 30, 5, 1, R);
    px(g, 10, 30, 1, 4, R);
    px(g, 14, 30, 1, 4, R);
    px(g, 10, 34, 5, 1, R);
    seg(g, 44, 14, 44, 29, R, 1);
    px(g, 42, 29, 5, 1, R);
    px(g, 42, 29, 1, 4, R);
    px(g, 46, 29, 1, 4, R);
    px(g, 42, 33, 5, 1, R);
    seg(g, 27, 16, 27, 25, R, 1);
    px(g, 25, 25, 5, 1, R);
    px(g, 25, 25, 1, 3, R);
    px(g, 29, 25, 1, 3, R);
    return cv;
  },

  // Keltir — small fox/hound cub, big ears, bushy tail (Talking Island)
  keltir(dark) {
    const [cv, g] = makeCv(42, 34);
    const B = dark ? "#8a5a3a" : "#b98a52",
      D = dark ? "#5f3a24" : "#7c5a34",
      L = dark ? "#a9784f" : "#d8b07a",
      E = "#ffd23d";
    px(g, 4, 12, 8, 5, D);
    px(g, 2, 10, 4, 4, L); // tail
    px(g, 9, 13, 16, 9, B);
    px(g, 10, 19, 14, 3, D); // body
    px(g, 24, 11, 9, 9, B); // head
    px(g, 25, 6, 3, 6, D);
    px(g, 30, 6, 3, 6, D); // ears
    px(g, 25, 7, 2, 4, L);
    px(g, 30, 7, 2, 4, L);
    px(g, 25, 12, 8, 3, L); // muzzle top
    px(g, 32, 17, 4, 3, B);
    px(g, 35, 18, 2, 2, D); // snout
    px(g, 27, 14, 2, 2, E); // eye
    seg(g, 12, 21, 11, 30, D, 2);
    seg(g, 16, 21, 16, 30, D, 2);
    seg(g, 22, 21, 23, 30, B, 2);
    seg(g, 26, 20, 27, 30, B, 2);
    px(g, 10, 29, 4, 2, D);
    px(g, 15, 29, 4, 2, D);
    px(g, 22, 29, 4, 2, B);
    px(g, 26, 29, 4, 2, B);
    return cv;
  },

  // Lizardman — upright reptile with a spear and a ridged crest
  lizardman(hot) {
    const [cv, g] = makeCv(44, 48);
    const S = hot ? "#b5522c" : "#4c7a3e",
      D = hot ? "#7d381d" : "#31532a",
      L = hot ? "#d9743f" : "#6fa552",
      SP = "#8a6a3b",
      E = "#ffd23d";
    px(g, 15, 4, 12, 11, S);
    px(g, 15, 8, 12, 2, D); // head
    px(g, 18, 2, 6, 3, D);
    px(g, 20, 0, 2, 3, D); // crest
    px(g, 17, 8, 2, 2, E);
    px(g, 23, 8, 2, 2, E);
    px(g, 15, 13, 12, 3, D); // jaw
    px(g, 12, 15, 18, 15, S);
    px(g, 13, 20, 16, 2, D);
    px(g, 14, 15, 12, 2, L); // torso
    px(g, 12, 28, 20, 3, D); // belt
    px(g, 8, 16, 4, 11, S);
    px(g, 30, 16, 4, 9, S); // arms
    px(g, 32, 4, 3, 24, SP); // spear shaft
    px(g, 31, 2, 5, 5, "#c9c2a8");
    px(g, 32, 0, 3, 3, "#c9c2a8"); // spear head
    px(g, 6, 26, 6, 4, S); // tail base
    px(g, 2, 28, 6, 3, D);
    px(g, 14, 30, 5, 10, S);
    px(g, 13, 39, 7, 3, D);
    px(g, 24, 30, 5, 10, S);
    px(g, 23, 39, 7, 3, D);
    return cv;
  },

  // Kasha / cave bear — hulking quadruped, side view
  bear(big) {
    const [cv, g] = makeCv(54, 44);
    const B = big ? "#5a4636" : "#6b5240",
      D = big ? "#3a2c22" : "#443328",
      L = big ? "#7a5f49" : "#8a6c52",
      E = "#ff5a4a";
    px(g, 8, 14, 20, 18, B);
    px(g, 9, 22, 18, 8, D); // body
    px(g, 24, 12, 14, 14, B); // shoulders
    px(g, 34, 10, 12, 12, B); // head
    px(g, 35, 6, 4, 5, D);
    px(g, 42, 6, 4, 5, D); // ears
    px(g, 44, 16, 5, 5, B);
    px(g, 47, 18, 3, 3, D); // snout
    px(g, 38, 14, 2, 2, E); // eye
    px(g, 10, 14, 22, 3, L); // back highlight
    px(g, 3, 20, 7, 5, B); // rump
    seg(g, 12, 30, 10, 42, D, 3);
    seg(g, 20, 30, 19, 42, D, 3);
    seg(g, 30, 26, 29, 42, D, 3);
    seg(g, 38, 24, 39, 42, D, 3);
    px(g, 8, 40, 6, 3, D);
    px(g, 16, 40, 6, 3, D);
    px(g, 26, 40, 6, 3, D);
    px(g, 36, 40, 6, 3, D);
    return cv;
  },

  // Mandragora — angry root-vegetable with a leafy crown
  mandragora(bloom) {
    const [cv, g] = makeCv(40, 46);
    const R = bloom ? "#c98be6" : "#c9a24a",
      RD = bloom ? "#7a4d90" : "#8a6a2b",
      RL = bloom ? "#e2b8f0" : "#e0c274",
      LF = "#4c8a3a",
      LD = "#2f5a24",
      MO = "#20140a";
    px(g, 8, 2, 6, 10, LD);
    px(g, 26, 2, 6, 10, LD);
    px(g, 14, 0, 5, 12, LF);
    px(g, 21, 0, 5, 12, LF);
    px(g, 17, 2, 6, 9, LD); // leaf crown
    px(g, 12, 10, 16, 18, R);
    px(g, 13, 18, 14, 3, RD);
    px(g, 14, 10, 12, 3, RL); // body
    px(g, 15, 16, 3, 3, MO);
    px(g, 22, 16, 3, 3, MO); // eyes
    px(g, 16, 22, 8, 3, MO); // mouth
    px(g, 17, 22, 2, 2, RL);
    px(g, 21, 22, 2, 2, RL); // teeth
    px(g, 9, 14, 4, 8, R);
    px(g, 27, 14, 4, 8, R); // arms
    px(g, 14, 28, 5, 12, RD);
    px(g, 13, 38, 4, 5, RD); // roots
    px(g, 21, 28, 5, 12, RD);
    px(g, 23, 38, 4, 5, RD);
    px(g, 18, 30, 4, 10, RD);
    return cv;
  },

  // Granite golem — blocky stone brute
  golem() {
    const [cv, g] = makeCv(50, 52);
    const S = "#7d7a72",
      D = "#4f4c46",
      L = "#a19d92",
      C = "#3a3833",
      E = "#8fd8ff";
    px(g, 17, 4, 16, 13, S);
    px(g, 17, 4, 16, 3, L);
    px(g, 17, 12, 16, 2, D); // head
    px(g, 20, 8, 4, 3, E);
    px(g, 26, 8, 4, 3, E); // eyes
    px(g, 10, 16, 30, 20, S);
    px(g, 11, 17, 28, 3, L);
    px(g, 12, 30, 26, 3, D); // torso
    px(g, 18, 20, 3, 12, C);
    px(g, 26, 20, 3, 12, C); // cracks
    px(g, 2, 16, 9, 22, S);
    px(g, 3, 17, 7, 3, L);
    px(g, 39, 16, 9, 22, S);
    px(g, 40, 17, 7, 3, L); // arms
    px(g, 1, 36, 11, 8, S);
    px(g, 38, 36, 11, 8, S); // fists
    px(g, 14, 36, 9, 14, S);
    px(g, 13, 48, 11, 3, D);
    px(g, 27, 36, 9, 14, S);
    px(g, 26, 48, 11, 3, D);
    return cv;
  },
};

const _spriteCache: Record<string, HTMLCanvasElement> = {};
export function spriteFor(art: SpriteKey, variant = false): HTMLCanvasElement {
  const key = art + (variant ? ":v" : "");
  if (!_spriteCache[key]) _spriteCache[key] = (BEASTS[art] || BEASTS.gremlin)(variant);
  return _spriteCache[key];
}

// ── hero: class body + equipped gear, drawn in layers ─────────────
interface Rig {
  hand: [number, number];
  off: [number, number];
  hand2: [number, number];
  head: [number, number, number, number];
  torso: [number, number, number, number];
  feet: [number, number][] | null;
}
const RIG: Record<ClassKey, Rig> = {
  glad: { hand: [21, 17], off: [3, 12], hand2: [3, 17], head: [8, 3, 9, 7], torso: [6, 10, 12, 10], feet: [[6, 28], [13, 28]] },
  sorc: { hand: [23, 20], off: [5, 17], hand2: [4, 20], head: [8, 7, 10, 5], torso: [7, 15, 13, 5], feet: null },
  th: { hand: [21, 18], off: [4, 16], hand2: [5, 18], head: [8, 7, 8, 5], torso: [8, 14, 9, 7], feet: [[8, 28], [14, 28]] },
};

const WEAPON_ART: Record<number, (g: G, ax: number, ay: number) => void> = {
  1(g, ax, ay) {
    const BL = "#d0d5df", BE = "#7f8490", HI = "#8a6a2b";
    px(g, ax, ay - 12, 2, 12, BL);
    px(g, ax + 1, ay - 12, 1, 12, BE);
    px(g, ax - 3, ay - 1, 8, 2, HI);
    px(g, ax, ay + 1, 2, 3, HI);
  },
  3(g, ax, ay) {
    const BL = "#dfe4ee", BE = "#9aa0ad";
    px(g, ax - 1, ay - 17, 4, 17, BL);
    px(g, ax + 2, ay - 17, 1, 17, BE);
    px(g, ax - 1, ay - 17, 4, 1, "#fff");
    px(g, ax - 4, ay - 1, 10, 2, "#c9a24a");
    px(g, ax, ay + 1, 2, 4, "#8a6a2b");
  },
  10(g, ax, ay) {
    const BL = "#cfd6e2", BE = "#868c99";
    px(g, ax, ay - 8, 2, 8, BL);
    px(g, ax + 1, ay - 8, 1, 8, BE);
    px(g, ax - 2, ay - 1, 6, 2, "#7a6a45");
    px(g, ax, ay + 1, 2, 3, "#4a3420");
  },
  8(g, ax, ay) {
    const WD = "#6b4a2b", WL = "#8a6438";
    const top = Math.max(4, ay - 16);
    px(g, ax, top, 2, ay + 3 - top, WD);
    px(g, ax + 1, top + 2, 1, ay + 1 - top, WL);
    ell(g, ax + 1, top - 2, 4, 4, "#3f7a34");
    ell(g, ax, top - 3, 2, 2, "#7fd06a");
  },
  13(g, ax, ay) {
    const WD = "#7a5a2f", WL = "#a2793f", ST = "#e8e2cc";
    const top = Math.max(2, ay - 14), bot = ay + 2, mid = (top + bot) / 2;
    for (let y = top; y <= bot; y++) {
      const t = (y - mid) / Math.max(1, (bot - top) / 2);
      px(g, ax + Math.round((1 - t * t) * 4), y, 2, 1, y % 4 ? WD : WL);
    }
    for (let y = top + 1; y < bot; y++) px(g, ax, y, 1, 1, ST);
  },
  257(g, ax, ay) {
    const BL = "#c9a3e6", DK = "#6a3f8c";
    g.save();
    g.shadowColor = "#c98be6";
    g.shadowBlur = 6;
    for (let i = 0; i < 13; i++) {
      const dx = Math.round(Math.sin((i / 12) * Math.PI) * 2);
      px(g, ax + dx, ay - 13 + i, 2, 1, i % 3 ? BL : DK);
    }
    g.restore();
    px(g, ax - 3, ay - 1, 8, 2, "#3a2a4a");
    px(g, ax, ay + 1, 2, 4, "#241a33");
  },
};
const SHIELD_ART: Record<number, (g: G, bx: number, by: number) => void> = {
  20(g, bx, by) {
    const SH = "#7a6a45", SD = "#584c31", SR = "#a7a7b0";
    px(g, bx - 3, by, 7, 11, SH);
    px(g, bx - 3, by, 7, 1, SR);
    px(g, bx - 3, by + 10, 7, 1, SR);
    px(g, bx - 3, by, 1, 11, SD);
    px(g, bx + 3, by, 1, 11, SD);
    px(g, bx - 1, by + 4, 3, 3, SR);
    px(g, bx - 1, by + 4, 3, 1, "#d7d7de");
  },
};
const ARMOR_ART: Record<number, (g: G, r: Rig) => void> = {
  43(g, r) {
    const [hx, hy, hw] = r.head, M = "#8a7a5a", ML = "#b8a887", MD = "#5f5238";
    px(g, hx, Math.max(0, hy - 3), hw, 3, M);
    px(g, hx + 1, Math.max(0, hy - 4), hw - 2, 1, ML);
    px(g, hx - 1, hy, hw + 2, 2, M);
    px(g, hx - 1, hy, hw + 2, 1, ML);
    px(g, hx - 1, hy + 2, 2, 4, M);
    px(g, hx + hw - 1, hy + 2, 2, 4, M);
    px(g, hx - 1, hy + 2, 1, 4, MD);
    px(g, hx + hw, hy + 2, 1, 4, MD);
  },
  49(g, r) {
    const C = "#6b5a3a", CL = "#8f7a52";
    px(g, r.hand[0] - 2, r.hand[1] + 1, 4, 4, C);
    px(g, r.hand[0] - 2, r.hand[1] + 1, 4, 1, CL);
    px(g, r.hand2[0] - 1, r.hand2[1] + 1, 4, 4, C);
    px(g, r.hand2[0] - 1, r.hand2[1] + 1, 4, 1, CL);
  },
  37(g, r) {
    if (!r.feet) return;
    r.feet.forEach(([fx, fy]) => {
      px(g, fx, fy, 5, 4, "#5b3a22");
      px(g, fx, fy, 5, 1, "#7c5030");
      px(g, fx, fy + 3, 5, 1, "#3a2416");
    });
  },
  393(g, r) {
    const [tx, ty, tw, th] = r.torso, M = "#9aa8bd", MD = "#5d6a80", ML = "#cfd9e8";
    px(g, tx, ty, tw, th, M);
    px(g, tx, ty, tw, 1, ML);
    for (let y = ty + 3; y < ty + th; y += 3) px(g, tx + 1, y, tw - 2, 1, MD);
    px(g, tx, ty, 1, th, MD);
    px(g, tx + tw - 1, ty, 1, th, MD);
    const cx = tx + Math.floor(tw / 2);
    px(g, cx - 2, ty, 4, 1, MD);
    px(g, cx - 1, ty + 1, 2, 2, MD);
    px(g, tx - 2, ty - 1, 4, 4, M);
    px(g, tx + tw - 2, ty - 1, 4, 4, M);
    px(g, tx - 2, ty - 1, 4, 1, ML);
    px(g, tx + tw - 2, ty - 1, 4, 1, ML);
  },
};
const JEWEL_COLOR: Record<number, string> = { 116: "#8fd8ff", 112: "#e9c877", 118: "#c98be6" };

const BODIES: Record<ClassKey, (g: G) => void> = {
  glad(g) {
    const SK = "#e7b389", SD = "#b6805a", HR = "#5b3d22", TU = "#b23a2c", TD = "#7c2519", PA = "#35406b", BO = "#3a2a18", HI = "#8a6a2b";
    px(g, 8, 3, 9, 7, SK);
    px(g, 7, 2, 11, 3, HR);
    px(g, 7, 3, 2, 5, HR);
    px(g, 8, 8, 9, 2, SD);
    px(g, 14, 6, 2, 2, "#1c1c1c");
    px(g, 6, 10, 12, 10, TU);
    px(g, 6, 16, 12, 2, TD);
    px(g, 6, 18, 12, 2, HI);
    px(g, 7, 10, 10, 2, "#c85248");
    px(g, 16, 11, 4, 7, SK);
    px(g, 18, 15, 4, 5, SK);
    px(g, 3, 11, 4, 8, SD);
    px(g, 7, 20, 4, 9, PA);
    px(g, 13, 20, 4, 9, PA);
    px(g, 6, 28, 5, 3, BO);
    px(g, 13, 28, 5, 3, BO);
  },
  sorc(g) {
    const SK = "#e7b389", SD = "#a87a56", RB = "#3f4f9e", RD = "#28316b", RL = "#5f70c4", TR = "#e9c877", TD = "#a8843a", BD = "#e4e0ee";
    px(g, 6, 1, 14, 7, RB);
    px(g, 7, 1, 12, 2, RL);
    px(g, 5, 6, 16, 4, RB);
    px(g, 8, 7, 10, 5, SD);
    px(g, 9, 8, 8, 3, SK);
    px(g, 10, 9, 2, 2, "#eaf4ff");
    px(g, 15, 9, 2, 2, "#eaf4ff");
    px(g, 9, 12, 9, 2, BD);
    px(g, 11, 14, 5, 2, BD);
    px(g, 6, 12, 16, 3, RD);
    px(g, 6, 12, 16, 1, RL);
    px(g, 7, 15, 13, 5, RB);
    px(g, 8, 15, 11, 1, RL);
    px(g, 12, 15, 3, 5, TR);
    px(g, 9, 20, 9, 2, TR);
    px(g, 9, 21, 9, 1, TD);
    px(g, 12, 20, 3, 2, "#fff3cf");
    px(g, 6, 22, 15, 5, RB);
    px(g, 5, 26, 17, 5, RD);
    px(g, 4, 30, 19, 2, RD);
    px(g, 9, 23, 2, 8, RD);
    px(g, 16, 23, 2, 8, RD);
    px(g, 13, 24, 2, 7, RD);
    px(g, 19, 14, 4, 6, RB);
    px(g, 20, 18, 3, 4, SK);
    px(g, 4, 14, 3, 7, RB);
    px(g, 4, 20, 3, 3, SK);
  },
  th(g) {
    const SK = "#c0a6cc", SD = "#96799f", HR = "#f2ecf8", HS = "#cfc6dc", LE = "#42513c", LL = "#5e7055", LD = "#26301f", CP = "#7a2a3c", CD = "#4e1524", HI = "#b08a33";
    px(g, 1, 12, 6, 14, CD);
    px(g, 2, 12, 4, 11, CP);
    px(g, 1, 24, 6, 4, CD);
    px(g, 6, 5, 2, 11, HR);
    px(g, 4, 9, 2, 8, HS);
    px(g, 5, 16, 3, 3, HR);
    px(g, 8, 3, 8, 2, HR);
    px(g, 8, 5, 8, 2, LE);
    px(g, 8, 5, 8, 1, LL);
    px(g, 8, 7, 8, 5, SK);
    px(g, 8, 7, 8, 1, SD);
    px(g, 9, 12, 6, 2, SK);
    px(g, 9, 13, 6, 1, SD);
    px(g, 10, 9, 2, 2, "#ff5a3c");
    px(g, 13, 9, 2, 2, "#ff5a3c");
    px(g, 16, 8, 3, 2, SK);
    px(g, 18, 7, 2, 2, SK);
    px(g, 8, 14, 9, 7, LE);
    px(g, 8, 14, 9, 2, LL);
    px(g, 8, 19, 9, 1, LD);
    px(g, 11, 15, 3, 5, LD);
    px(g, 8, 21, 9, 1, LD);
    px(g, 11, 21, 3, 1, HI);
    px(g, 5, 15, 3, 5, LE);
    px(g, 17, 15, 3, 5, LE);
    px(g, 5, 18, 3, 3, SK);
    px(g, 17, 18, 3, 3, SK);
    px(g, 9, 22, 3, 7, LE);
    px(g, 14, 22, 3, 7, LE);
    px(g, 8, 28, 5, 3, LD);
    px(g, 14, 28, 5, 3, LD);
  },
};
const DAGGERS = [10, 257];

export interface GearView {
  wpn: number | null;
  arm: number | null;
  shd: number | null;
  acc: number | null;
}
const _heroCv: Record<string, HTMLCanvasElement> = {};
export function heroSprite(cls: ClassKey, gear: GearView): HTMLCanvasElement {
  const key = [cls, gear.wpn, gear.arm, gear.shd, gear.acc].join("|");
  if (_heroCv[key]) return _heroCv[key];
  const [cv, g] = makeCv(28, 34);
  const r = RIG[cls] || RIG.glad;
  (BODIES[cls] || BODIES.glad)(g);
  if (gear.arm && ARMOR_ART[gear.arm]) ARMOR_ART[gear.arm](g, r);
  if (gear.shd && SHIELD_ART[gear.shd]) SHIELD_ART[gear.shd](g, r.off[0], r.off[1]);
  if (cls === "th" && gear.wpn && DAGGERS.includes(gear.wpn)) {
    px(g, 2, 20, 2, 6, "#e2e7f0");
    px(g, 3, 20, 1, 6, "#9aa0ad");
    px(g, 1, 18, 4, 2, "#b08a33");
  }
  if (gear.wpn && WEAPON_ART[gear.wpn]) WEAPON_ART[gear.wpn](g, r.hand[0], r.hand[1]);
  if (gear.acc && JEWEL_COLOR[gear.acc]) {
    const [tx, ty, tw] = r.torso;
    g.save();
    g.shadowColor = JEWEL_COLOR[gear.acc];
    g.shadowBlur = 5;
    px(g, tx + Math.floor(tw / 2), ty + 1, 2, 2, JEWEL_COLOR[gear.acc]);
    g.restore();
  }
  _heroCv[key] = cv;
  return cv;
}

// ── UI icons (fight / skills) ────────────────────────────────────
const UI_ART: Record<string, (g: G) => void> = {
  swords(g) {
    const BL = "#e6ebf4", BE = "#98a0b0", GD = "#d8ab3e", GR = "#6b4423", PM = "#c9a24a";
    const hoja = (gx: number, gy: number, tx: number, ty: number) => {
      seg(g, gx, gy, tx, ty, BE, 4);
      seg(g, gx, gy, tx, ty, BL, 2);
      px(g, tx - 1, ty - 1, 3, 3, BL);
    };
    hoja(8, 25, 25, 6);
    hoja(24, 25, 7, 6);
    px(g, 4, 19, 10, 3, GD);
    px(g, 18, 19, 10, 3, GD);
    px(g, 5, 24, 5, 4, GR);
    px(g, 22, 24, 5, 4, GR);
    px(g, 4, 28, 7, 2, PM);
    px(g, 21, 28, 7, 2, PM);
  },
  book(g) {
    const CV = "#7a2a3c", CD = "#4a1523", PG = "#efe4ce", PD = "#c2b498", GD = "#d8ab3e";
    px(g, 3, 4, 26, 24, CD);
    px(g, 4, 5, 24, 22, CV);
    px(g, 5, 6, 10, 20, PG);
    px(g, 17, 6, 10, 20, PG);
    px(g, 5, 6, 10, 2, PD);
    px(g, 17, 6, 10, 2, PD);
    for (let i = 0; i < 4; i++) {
      px(g, 7, 11 + i * 4, 6, 1, PD);
      px(g, 19, 11 + i * 4, 6, 1, PD);
    }
    px(g, 15, 4, 2, 24, CD);
    px(g, 15, 2, 2, 7, GD);
  },
};
const _uiIcon: Record<string, string> = {};
export function uiIcon(name: string): string {
  if (_uiIcon[name]) return _uiIcon[name];
  const [cv, g] = makeCv(32, 32);
  UI_ART[name](g);
  return (_uiIcon[name] = cv.toDataURL());
}

// ── battle backdrops (portrait 100×160) ──────────────────────────
export type BackdropKind = "field" | "ruins" | "canyon" | "grave";
export function backdropKind(zone?: {
  id: string;
  region: string;
}): BackdropKind {
  if (!zone) return "field";
  if (zone.id === "exec") return "grave";
  if (zone.region === "Dion") return "canyon";
  if (zone.region === "Gludio") return "ruins";
  return "field";
}
const SCENES: Record<
  BackdropKind,
  {
    sky: [string, string];
    far: string;
    side: string;
    sideDk: string;
    path: string;
    pathDk: string;
    edge: string;
  }
> = {
  field: { sky: ["#8fd4ef", "#cfe9ef"], far: "#7bb058", side: "#4b8436", sideDk: "#3c722c", path: "#8fbf6b", pathDk: "#75a457", edge: "#5d8b45" },
  ruins: { sky: ["#b7a78f", "#8b8682"], far: "#6f6552", side: "#5c5343", sideDk: "#463f33", path: "#8a8071", pathDk: "#6f665a", edge: "#5a5147" },
  canyon: { sky: ["#eaae67", "#f3d6a6"], far: "#b06a3a", side: "#9a5a34", sideDk: "#7d4526", path: "#c89a63", pathDk: "#a87a48", edge: "#8a6238" },
  grave: { sky: ["#39324a", "#585067"], far: "#4a4054", side: "#3a3430", sideDk: "#2a2622", path: "#5a5145", pathDk: "#463f36", edge: "#332e28" },
};
export function drawBackdrop(g: G, W: number, H: number, kind: BackdropKind) {
  const C = SCENES[kind] || SCENES.field;
  g.clearRect(0, 0, W, H);
  const gl = Math.round(H * 0.3);
  const gr = g.createLinearGradient(0, 0, 0, gl);
  gr.addColorStop(0, C.sky[0]);
  gr.addColorStop(1, C.sky[1]);
  g.fillStyle = gr;
  g.fillRect(0, 0, W, gl);
  px(g, 0, gl - 4, W, 4, C.far);
  px(g, 0, gl, W, H - gl, C.side);
  for (let i = 0; i < 26; i++) {
    const t = (i % 13) / 13,
      y = gl + Math.round(t * t * (H - gl));
    const x = (i * 37 + ((i * 17) % 29)) % W;
    px(g, x, y, 3 + Math.round(t * 5), 1 + Math.round(t * 2), C.sideDk);
  }
  const wTop = 0.14,
    wBot = 0.92;
  for (let y = gl; y < H; y++) {
    const t = (y - gl) / (H - gl),
      w = W * (wTop + (wBot - wTop) * t * t * 0.55 + (wBot - wTop) * t * 0.45);
    const x = Math.round((W - w) / 2);
    px(g, x, y, Math.round(w), 1, y % 9 < 4 ? C.path : C.pathDk);
    px(g, x, y, 1, 1, C.edge);
    px(g, x + Math.round(w) - 1, y, 1, 1, C.edge);
  }
  const prop = (
    t: number,
    side: number,
    fn: (x: number, y: number, sc: number) => void,
  ) => {
    const y = gl + Math.round(t * (H - gl));
    const w = W * (wTop + (wBot - wTop) * t * t * 0.55 + (wBot - wTop) * t * 0.45);
    const sc = 0.35 + t * 1.15;
    fn(Math.round(W / 2 + side * (w / 2 + 3 + t * 6)), y, sc);
  };
  if (kind === "field") {
    for (let i = 0; i < 6; i++)
      px(g, (i * 23 + 9) % W, 4 + ((i * 11) % 14), 9 + (i % 3) * 4, 3, "#eef4f6");
    (
      [
        [0.08, -1],
        [0.18, 1],
        [0.36, -1],
        [0.55, 1],
        [0.78, -1],
        [0.95, 1],
      ] as [number, number][]
    ).forEach(([t, sd]) =>
      prop(t, sd, (x, y, sc) => {
        const h = Math.round(9 * sc);
        px(g, x - 1, y - h, 2, h, "#4a3420");
        ell(g, x, y - h - Math.round(3 * sc), Math.round(6 * sc), Math.round(5 * sc), "#2f5a22");
      }),
    );
    for (let i = 0; i < 14; i++) {
      const t = (i % 7) / 7,
        y = gl + Math.round(t * (H - gl));
      px(g, (i * 29 + 5) % W, y, 1, 1 + Math.round(t * 2), "#3f7a2f");
    }
  } else if (kind === "ruins") {
    (
      [
        [0.05, -1],
        [0.12, 1],
        [0.3, -1],
        [0.5, 1],
        [0.72, -1],
        [0.93, 1],
      ] as [number, number][]
    ).forEach(([t, sd]) =>
      prop(t, sd, (x, y, sc) => {
        const h = Math.round(26 * sc),
          w = Math.max(2, Math.round(6 * sc));
        px(g, x - w / 2, y - h, w, h, "#8a8378");
        px(g, x - w / 2, y - h, w, Math.max(1, Math.round(2 * sc)), "#a29a8c");
        px(g, x - w / 2 - 1, y - h - Math.round(2 * sc), w + 2, Math.max(1, Math.round(3 * sc)), "#8a8378");
        px(g, x - w / 2 - 1, y - 1, w + 2, 2, "#736a5c");
      }),
    );
  } else if (kind === "canyon") {
    px(g, 0, gl - 14, Math.round(W * 0.26), 14 + Math.round(H * 0.12), "#9a5a34");
    px(g, W - Math.round(W * 0.26), gl - 18, Math.round(W * 0.26), 18 + Math.round(H * 0.14), "#9a5a34");
    for (let y = gl - 16; y < gl + Math.round(H * 0.12); y += 5) {
      px(g, 0, y, Math.round(W * 0.26), 1, "#7d4526");
      px(g, W - Math.round(W * 0.26), y, Math.round(W * 0.26), 1, "#7d4526");
    }
    (
      [
        [0.22, -1],
        [0.45, 1],
        [0.7, -1],
        [0.92, 1],
      ] as [number, number][]
    ).forEach(([t, sd]) =>
      prop(t, sd, (x, y, sc) => {
        const r = Math.round(5 * sc);
        ell(g, x, y - r, r, Math.round(r * 0.8), "#a87a48");
      }),
    );
  } else {
    for (let i = 0; i < 4; i++)
      px(g, 0, Math.round(H * 0.1) + i * 7, W, 2, "rgba(200,200,210,0.05)");
    (
      [
        [0.06, -1],
        [0.14, 1],
        [0.32, -1],
        [0.52, 1],
        [0.75, -1],
        [0.95, 1],
      ] as [number, number][]
    ).forEach(([t, sd]) =>
      prop(t, sd, (x, y, sc) => {
        const h = Math.round(13 * sc);
        px(g, x - 1, y - h, Math.max(2, Math.round(3 * sc)), h, "#1a1620");
        px(g, x - Math.round(3 * sc), y - h, Math.round(6 * sc), Math.max(1, Math.round(2 * sc)), "#1a1620");
      }),
    );
    const gx = Math.round(W * 0.5),
      gy = gl + Math.round((H - gl) * 0.1);
    px(g, gx, gy - 16, 2, 16, "#161018");
    px(g, gx, gy - 16, 10, 2, "#161018");
    px(g, gx + 8, gy - 14, 1, 5, "#4a4030");
  }
  const vg = g.createLinearGradient(0, H * 0.7, 0, H);
  vg.addColorStop(0, "rgba(8,6,14,0)");
  vg.addColorStop(1, "rgba(8,6,14,0.35)");
  g.fillStyle = vg;
  g.fillRect(0, Math.round(H * 0.7), W, Math.round(H * 0.3));
}
