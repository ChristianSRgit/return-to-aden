import {
  LVL_BONUS_PER,
  LVL_BONUS_CAP,
  LVL_MALUS_PER,
  LVL_MALUS_FLOOR,
  RUN_STEP,
  RUN_CAP,
} from "../data";
import { S } from "./state";

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const chance = (pct: number) => Math.random() * 100 < pct;

// Level-difference payout scaling. Fighting above your level pays more
// (risk/reward); farming far below pays much less. Asymmetric for loot:
// below-level never *worsens* drop odds, it just kills the XP/adena.
export function levelMult(mobLv: number): number {
  const d = mobLv - (S().lv ?? 1);
  if (d >= 0) return 1 + Math.min(d * LVL_BONUS_PER, LVL_BONUS_CAP);
  return Math.max(LVL_MALUS_FLOOR, 1 + d * LVL_MALUS_PER);
}

export function runMult(): number {
  const run = S().run;
  return run ? 1 + Math.min(run.streak * RUN_STEP, RUN_CAP) : 1;
}
