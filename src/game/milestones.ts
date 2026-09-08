// The reward ladder. There is always one nearby; when met it stays claimable
// (red badge) and claiming it pays. This is the "one more, then I stop" motor.

import { SLOTS } from "../data";
import { S, give, save } from "./state";
import { sfx } from "./audio";
import { fmt } from "./format";

export interface Milestone {
  id: string;
  t: string;
  d: string;
  cur: () => number;
  goal: number;
  rw: { adena?: number; sp?: number; pot?: number };
}

export const MILES: Milestone[] = [
  { id: "kill10", t: "Primera sangre", d: "10 presas", cur: () => S().stats.kills, goal: 10, rw: { adena: 300 } },
  { id: "lv5", t: "Con las botas puestas", d: "Nivel 5", cur: () => S().lv, goal: 5, rw: { adena: 400, pot: 3 } },
  { id: "gear2", t: "Equipado", d: "2 ranuras con equipo", cur: () => SLOTS.filter((x) => S().gear[x.k]).length, goal: 2, rw: { adena: 700 } },
  { id: "streak5", t: "Sin frenar", d: "Racha de 5", cur: () => S().stats.bestStreak, goal: 5, rw: { sp: 120 } },
  { id: "kill100", t: "Cazador", d: "100 presas", cur: () => S().stats.kills, goal: 100, rw: { adena: 2500, pot: 5 } },
  { id: "lv15", t: "Veterano", d: "Nivel 15", cur: () => S().lv, goal: 15, rw: { sp: 250 } },
  { id: "skill4", t: "Grimorio", d: "4 habilidades aprendidas", cur: () => S().known.length, goal: 4, rw: { adena: 3000 } },
  { id: "gear4", t: "De pies a cabeza", d: "Las 4 ranuras con equipo", cur: () => SLOTS.filter((x) => S().gear[x.k]).length, goal: 4, rw: { sp: 200, pot: 5 } },
  { id: "streak10", t: "Imparable", d: "Racha de 10", cur: () => S().stats.bestStreak, goal: 10, rw: { sp: 400, pot: 8 } },
  { id: "rich", t: "Bolsa pesada", d: "25.000 adena en mano", cur: () => S().adena, goal: 25000, rw: { sp: 300 } },
  { id: "raid", t: "Matagigantes", d: "Derrotar al Hangman Tree", cur: () => S().stats.raids || 0, goal: 1, rw: { adena: 15000, sp: 600 } },
  { id: "kill500", t: "Leyenda de Aden", d: "500 presas", cur: () => S().stats.kills, goal: 500, rw: { adena: 20000, sp: 800 } },
  { id: "lv30", t: "Señor de Aden", d: "Nivel 30", cur: () => S().lv, goal: 30, rw: { adena: 30000, sp: 1500 } },
];

export const mileDone = (m: Milestone) => m.cur() >= m.goal;
export const mileClaimed = (m: Milestone) => !!S().claimed?.[m.id];
export const milesReady = () =>
  MILES.filter((m) => mileDone(m) && !mileClaimed(m)).length;

export function nextMile(): Milestone | null {
  const pend = MILES.filter((m) => !mileClaimed(m));
  return (
    pend.find(mileDone) ||
    pend.sort((a, b) => b.cur() / b.goal - a.cur() / a.goal)[0] ||
    null
  );
}

export function mileReward(m: Milestone): string {
  return [
    m.rw.adena ? fmt(m.rw.adena) + " adena" : null,
    m.rw.sp ? m.rw.sp + " SP" : null,
    m.rw.pot ? m.rw.pot + " pociones" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function claimMile(m: Milestone): boolean {
  if (!mileDone(m) || mileClaimed(m)) return false;
  const s = S();
  s.claimed[m.id] = 1;
  if (m.rw.adena) s.adena += m.rw.adena;
  if (m.rw.sp) s.sp += m.rw.sp;
  if (m.rw.pot) give(1061, m.rw.pot);
  save();
  sfx("level");
  return true;
}
