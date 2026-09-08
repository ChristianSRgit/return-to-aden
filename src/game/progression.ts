// XP / SP curves and derived-stat maths. Pure functions — no state.

import { SP_PER_XP, XP_MULT } from "../data";

export function xpToNext(lv: number): number {
  return Math.round(38 * Math.pow(lv, 1.72)) + 25;
}
export function totalXpTo(lv: number): number {
  let t = 0;
  for (let i = 1; i < lv; i++) t += xpToNext(i);
  return t;
}
// Roughly the SP a character of level `lv` would have banked at today's rates.
export function retroSp(lv: number): number {
  return Math.round(totalXpTo(lv) * SP_PER_XP);
}

export const nn = (x: unknown, def: number): number =>
  typeof x === "number" && isFinite(x) ? x : def;

export { XP_MULT };
