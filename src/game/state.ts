// Game state + persistence. The engine mutates `state` imperatively (a
// faithful port of the v1 model); `rev` is a signal bumped on every change
// so Preact screens re-render. Screens read `rev.value` then `S()`.

import { signal } from "@preact/signals";
import {
  CLASSES,
  GEAR,
  ITEMS,
  SKILLS,
  SLOTS,
  ZONES,
  SAVE_KEY,
  SAVE_V,
  skillFits,
  type ClassKey,
} from "../data";
import { nn, retroSp } from "./progression";
import type { GameState, StatBlock } from "./types";

let state: GameState | null = null;
export const rev = signal(0);
export const saveStatus = signal<"idle" | "ok" | "warn">("idle");

export function S(): GameState {
  if (!state) throw new Error("game state not initialised");
  return state;
}
export function hasGame(): boolean {
  return state !== null;
}
export function setState(next: GameState | null) {
  state = next;
  touch();
}
export function touch() {
  rev.value++;
}

// ── new game ──────────────────────────────────────────────────────
export function newGame(cls: ClassKey): GameState {
  const c = CLASSES[cls];
  const s: GameState = {
    v: SAVE_V,
    cls,
    lv: 1,
    xp: 0,
    sp: 0,
    base: { ...c.base },
    hp: c.base.hp,
    mp: c.base.mp,
    hpMax: c.base.hp,
    mpMax: c.base.mp,
    pAtk: c.base.pAtk,
    pDef: c.base.pDef,
    luck: c.base.luck,
    frac: { hp: 0, mp: 0, pAtk: 0, pDef: 0, luck: 0 },
    adena: 60,
    inv: { 1060: 5 },
    known: [c.start],
    loadout: [c.start],
    gear: { wpn: c.wpn, arm: null, shd: null, acc: null },
    run: null,
    lastZone: null,
    claimed: {},
    bestiary: {},
    opts: { sfx: true, shots: true, spd: 1, auto: false },
    stats: {
      kills: 0,
      drops: 0,
      deaths: 0,
      started: Date.now(),
      best: 0,
      runs: 0,
      bestStreak: 0,
      bestRun: 0,
      raids: 0,
    },
  };
  s.inv[c.shot] = c.shot === 2509 ? 12 : 15;
  state = s;
  recalc();
  s.hp = s.hpMax;
  s.mp = s.mpMax;
  save();
  touch();
  return s;
}

// ── derived stats ─────────────────────────────────────────────────
export function gearBonus(s = S()): StatBlock {
  const t: StatBlock = { hp: 0, mp: 0, pAtk: 0, pDef: 0, luck: 0 };
  for (const slot of SLOTS) {
    const id = s.gear[slot.k];
    const g = id != null ? GEAR[id] : undefined;
    if (!g) continue;
    for (const st in g.b) {
      const k = st as keyof StatBlock;
      t[k] += g.b[k as keyof typeof g.b] ?? 0;
    }
  }
  return t;
}
export function recalc(s = S()) {
  const g = gearBonus(s);
  s.hpMax = Math.max(1, Math.round(s.base.hp + g.hp));
  s.mpMax = Math.max(0, Math.round(s.base.mp + g.mp));
  s.pAtk = Math.max(1, Math.round(s.base.pAtk + g.pAtk));
  s.pDef = Math.max(0, Math.round(s.base.pDef + g.pDef));
  s.luck = Math.max(0, Math.round(s.base.luck + g.luck));
  s.hp = Math.max(0, Math.min(s.hpMax, Math.round(s.hp)));
  s.mp = Math.max(0, Math.min(s.mpMax, Math.round(s.mp)));
}

// ── save repair & migration ──────────────────────────────────────
// Runs on every load and every imported backup. Copes with saves from any
// older build and with hand-typed text.
export function normalize(raw: unknown): GameState | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown> & Partial<GameState>;
  const c = CLASSES[d.cls as ClassKey];
  if (!c) return null;

  d.lv = Math.max(1, Math.round(nn(d.lv, 1)));
  d.xp = Math.max(0, Math.round(nn(d.xp, 0)));
  d.sp = Math.max(0, Math.round(nn(d.sp, 0)));
  d.adena = Math.max(0, Math.round(nn(d.adena, 0)));
  if (!d.inv || typeof d.inv !== "object") d.inv = {};
  for (const id of Object.keys(d.inv)) {
    const q = Math.floor(nn(d.inv[Number(id)], 0));
    if (!ITEMS[Number(id)] || q <= 0) delete d.inv[Number(id)];
    else d.inv[Number(id)] = q;
  }

  // v1 → v2: v1 stored only effective stats and had no gear.
  if (nn(d.v, 1) < 2) {
    d.base = {
      hp: nn(d.hpMax, c.base.hp),
      mp: nn(d.mpMax, c.base.mp),
      pAtk: nn(d.pAtk, c.base.pAtk),
      pDef: nn(d.pDef, c.base.pDef),
      luck: nn(d.luck, c.base.luck),
    };
    d.gear = { wpn: c.wpn, arm: null, shd: null, acc: null };
    d.sp += retroSp(d.lv);
    d.frac = { hp: 0, mp: 0, pAtk: 0, pDef: 0, luck: 0 };
    d.v = 2;
    d._migrated = true;
  }

  if (!d.base || typeof d.base !== "object")
    d.base = {
      hp: nn(d.hpMax, c.base.hp),
      mp: nn(d.mpMax, c.base.mp),
      pAtk: nn(d.pAtk, c.base.pAtk),
      pDef: nn(d.pDef, c.base.pDef),
      luck: nn(d.luck, c.base.luck),
    };
  for (const k of ["hp", "mp", "pAtk", "pDef", "luck"] as const)
    d.base[k] = Math.max(0, nn(d.base[k], c.base[k]));
  if (!d.frac || typeof d.frac !== "object")
    d.frac = { hp: 0, mp: 0, pAtk: 0, pDef: 0, luck: 0 };

  // gear: drop anything that isn't a real item for that slot
  if (!d.gear || typeof d.gear !== "object")
    d.gear = { wpn: null, arm: null, shd: null, acc: null };
  for (const slot of SLOTS) {
    const id = d.gear[slot.k];
    if (id == null || !GEAR[id] || GEAR[id].slot !== slot.k) d.gear[slot.k] = null;
  }

  // skills
  if (!Array.isArray(d.known) || !d.known.length) d.known = [c.start];
  if (!Array.isArray(d.loadout) || !d.loadout.length) d.loadout = [c.start];
  if (nn(d.v, 0) < 3) {
    let refund = 0;
    d.known.forEach((k) => {
      if (SKILLS[k] && !skillFits(k, d.cls as ClassKey))
        refund += SKILLS[k].cost || 0;
    });
    if (refund > 0) {
      d.sp = (d.sp || 0) + refund;
      d._refund = refund;
    }
    if (d.base && d.lv > 1) {
      for (const k of ["hp", "mp", "pAtk", "pDef", "luck"] as const)
        d.base[k] = c.base[k] + Math.floor(c.grow[k] * (d.lv - 1));
    }
    d.v = 3;
  }
  d.known = d.known.filter((k) => skillFits(k, d.cls as ClassKey));
  if (!d.known.includes(c.start)) d.known.unshift(c.start);
  d.known = [...new Set(d.known)];
  d.loadout = [...new Set(d.loadout)]
    .filter(
      (k) =>
        SKILLS[k] && d.known!.includes(k) && d.lv! >= (SKILLS[k].req || 0),
    )
    .slice(0, 3);
  if (!d.loadout.length) d.loadout = [c.start];

  // misc containers
  if (!d.opts || typeof d.opts !== "object") d.opts = {} as GameState["opts"];
  d.opts.sfx = d.opts.sfx !== false;
  d.opts.shots = d.opts.shots !== false;
  d.opts.spd = ([1, 2, 3] as const).includes(d.opts.spd) ? d.opts.spd : 1;
  d.opts.auto = d.opts.auto === true;
  const st = (d.stats && typeof d.stats === "object" ? d.stats : {}) as Record<
    string,
    unknown
  >;
  d.stats = {
    kills: Math.max(0, Math.round(nn(st.kills, 0))),
    drops: Math.max(0, Math.round(nn(st.drops, 0))),
    deaths: Math.max(0, Math.round(nn(st.deaths, 0))),
    started: nn(st.started, Date.now()),
    best: Math.max(0, Math.round(nn(st.best, 0))),
    runs: Math.max(0, Math.round(nn(st.runs, 0))),
    bestStreak: Math.max(0, Math.round(nn(st.bestStreak, 0))),
    bestRun: Math.max(0, Math.round(nn(st.bestRun, 0))),
    raids: Math.max(0, Math.round(nn(st.raids, 0))),
  };
  if (!d.claimed || typeof d.claimed !== "object") d.claimed = {};
  if (!d.bestiary || typeof d.bestiary !== "object") d.bestiary = {};
  if (d.lastZone && !ZONES.some((z) => z.id === d.lastZone)) d.lastZone = null;
  if (d.run && !ZONES.some((z) => z.id === d.run!.zone)) d.run = null;
  d.v = SAVE_V;

  const full = d as GameState;
  const keep = state;
  state = full;
  recalc();
  state = keep;
  return full;
}

export function validSave(d: unknown): boolean {
  if (!d || typeof d !== "object") return false;
  const o = d as Record<string, unknown>;
  const v = nn(o.v, 0);
  return v >= 1 && v <= SAVE_V && !!CLASSES[o.cls as ClassKey];
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    saveStatus.value = "ok";
    setTimeout(() => {
      if (saveStatus.value === "ok") saveStatus.value = "idle";
    }, 1400);
  } catch {
    saveStatus.value = "warn";
  }
  // Every persisted mutation must re-render the screens. Without this a
  // successful purchase / equip left the UI showing the pre-change state
  // (stale SP counter → a second click looked like "no me deja comprar",
  // and the change only appeared after navigating away and back).
  touch();
}
export function saveSoon() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 400);
}
export function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!validSave(d)) return null;
    return normalize(d);
  } catch {
    return null;
  }
}
export function wipeSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}
export function hasStorage(): boolean {
  try {
    localStorage.setItem("_t", "1");
    localStorage.removeItem("_t");
    return true;
  } catch {
    return false;
  }
}

// ── inventory helpers ────────────────────────────────────────────
export function give(id: number, q: number) {
  const s = S();
  s.inv[id] = (s.inv[id] || 0) + q;
}
export function take(id: number, q: number) {
  const s = S();
  s.inv[id] = Math.max(0, (s.inv[id] || 0) - q);
  if (!s.inv[id]) delete s.inv[id];
}
export function count(id: number): number {
  return S().inv[id] || 0;
}
