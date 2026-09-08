import type { ClassKey, GearSlot } from "../data";

export interface GameStats {
  kills: number;
  drops: number;
  deaths: number;
  started: number;
  best: number;
  runs: number;
  bestStreak: number;
  bestRun: number;
  raids: number;
}

export interface GameOpts {
  sfx: boolean;
  shots: boolean;
  spd: 1 | 2 | 3;
  auto: boolean;
}

export interface RunState {
  zone: string;
  streak: number;
  kills: number;
  adena: number;
  xp: number;
  sp: number;
  items: Record<number, number>;
}

export interface Gear {
  wpn: number | null;
  arm: number | null;
  shd: number | null;
  acc: number | null;
}

export interface StatBlock {
  hp: number;
  mp: number;
  pAtk: number;
  pDef: number;
  luck: number;
}

export interface GameState {
  v: number;
  cls: ClassKey;
  lv: number;
  xp: number;
  sp: number;
  base: StatBlock;
  hp: number;
  mp: number;
  hpMax: number;
  mpMax: number;
  pAtk: number;
  pDef: number;
  luck: number;
  frac: StatBlock;
  adena: number;
  inv: Record<number, number>;
  known: string[];
  loadout: string[];
  gear: Gear;
  run: RunState | null;
  lastZone: string | null;
  claimed: Record<string, number>;
  bestiary: Record<number, number>; // monster id → total kills
  opts: GameOpts;
  stats: GameStats;
  // transient migration flags
  _migrated?: boolean;
  _refund?: number;
}

export type { ClassKey, GearSlot };
