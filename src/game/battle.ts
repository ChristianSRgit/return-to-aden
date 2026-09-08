// Battle engine. Faithful port of the v1 turn loop. The engine owns all
// timing (via `wait`) and mutates B / game state imperatively; it emits FX
// events that the Battle screen renders (popups, screen shake, hero pose,
// transient effect sprites). Screens read the `battle` / `battleLog` signals.

import { signal } from "@preact/signals";
import {
  CLASSES,
  MOBS,
  SKILLS,
  ITEMS,
  ZONES,
  XP_MULT,
  SP_MULT,
  CHAMP_EVERY,
  CHAMP_MULT,
  ELITE_FROM,
  ELITE_CHANCE,
  ELITE_MULT,
  type MobDef,
  type ZoneDef,
} from "../data";
import {
  S,
  save,
  saveSoon,
  give,
  take,
  count,
  recalc,
  touch,
} from "./state";
import { sfx } from "./audio";
import { rand, chance, levelMult, runMult } from "./rng";
import { xpToNext } from "./progression";
import { skillsOf } from "../data";
import { milesReady } from "./milestones";
import { backdropKind } from "../art/pixels";
import { motionOff } from "./settings";

// ── FX bus ───────────────────────────────────────────────────────
export type FxEvent =
  | { t: "popup"; text: string; cls: string; where: "hero" | "mob" }
  | { t: "hit"; who: "hero" | "mob" }
  | { t: "flash"; strong?: boolean }
  | { t: "shake"; amp?: number }
  | {
      t: "sparks";
      where: "hero" | "mob";
      crit: boolean;
      power: number;
      kind: "phys" | "magic";
    }
  | { t: "critpulse"; who: "hero" | "mob" }
  | { t: "pose"; pose: "lunge" | "cast" | "idle" }
  | { t: "spawn"; cls: string; host: "hero" | "foe" | "arena"; life: number; html?: string }
  | { t: "streak"; text: string; sub?: string }
  | { t: "result"; kind: "victory" | "defeat"; data: VictoryData | DefeatData }
  | { t: "levelup"; gains: LevelGain[] }
  | { t: "closeResult" };

type FxHandler = (e: FxEvent) => void;
const fxHandlers = new Set<FxHandler>();
export function onFx(h: FxHandler) {
  fxHandlers.add(h);
  return () => fxHandlers.delete(h);
}
function fx(e: FxEvent) {
  fxHandlers.forEach((h) => h(e));
}

// ── speed / timing ──────────────────────────────────────────────
export const speed = signal<1 | 2 | 3>(1);
export const ms = (x: number) => Math.max(1, Math.round(x / speed.value));
export const wait = (x: number) => new Promise((r) => setTimeout(r, ms(x)));
// A brief scene freeze right on impact — the single biggest "hits feel good"
// lever. Not scaled by `speed` so it stays punchy even at ×3.
const hitstop = (x: number) =>
  motionOff() ? Promise.resolve() : new Promise((r) => setTimeout(r, x));

// ── battle state ────────────────────────────────────────────────
export interface BuffState {
  name?: string;
  dmg?: number;
  def?: number;
  crit?: number;
  evade?: number;
  lifesteal?: number;
  shield?: number;
  turns: number;
  fresh?: boolean;
}
export interface BattleState {
  mid: number;
  zone: ZoneDef | undefined;
  m: MobDef & { elite?: boolean; champ?: boolean };
  mHp: number;
  mHpMax: number;
  guard: boolean;
  stunned: boolean;
  queued: (() => void) | null;
  turnNo: number;
  mdeb: { def: number; turns: number; name?: string; fresh?: boolean } | null;
  auto: boolean;
  intent: { heavy: boolean };
  armed: boolean;
  buff: BuffState | null;
  busy: boolean;
  over: boolean;
}
export const battle = signal<BattleState | null>(null);
export const battleLog = signal<{ txt: string; cls: string }[]>([]);
let B: BattleState | null = null;

function pushLog(txt: string, cls = "") {
  battleLog.value = [...battleLog.value, { txt, cls }].slice(-3);
}
function popup(text: string, cls: string, where: "hero" | "mob") {
  fx({ t: "popup", text, cls, where });
}
function hitFx(who: "hero" | "mob" = "mob") {
  fx({ t: "hit", who });
}
function flash(strong = false) {
  if (!motionOff()) fx({ t: "flash", strong });
}
function shake(amp = 1) {
  if (!motionOff()) fx({ t: "shake", amp });
}
function sparks(
  where: "hero" | "mob",
  crit: boolean,
  power: number,
  kind: "phys" | "magic",
) {
  if (motionOff()) return;
  fx({ t: "sparks", where, crit, power, kind });
  if (crit) fx({ t: "critpulse", who: where });
}
function streakBanner(text: string, sub?: string) {
  fx({ t: "streak", text, sub });
}
function sync() {
  battle.value = B ? { ...B } : null;
  touch();
}

// ── ammo helpers ────────────────────────────────────────────────
export const shotId = () => CLASSES[S().cls].shot;
export const shotName = () => ITEMS[shotId()].n.split(":")[0];

// ── combat math ─────────────────────────────────────────────────
const BAL = { pk: 85, pd: 1.0, mk: 95, md: 0.9 };
export function critChance() {
  return Math.max(0.03, Math.min(0.5, S().luck / 100 + 0.03));
}
export function mpRegen() {
  return Math.max(2, Math.round(S().mpMax * 0.12));
}
interface HitOpts {
  mult?: number;
  pierce?: number;
  critBonus?: number;
  shot?: boolean;
  hpScale?: number;
  execute?: { below: number; bonus: number } | null;
  opener?: number;
}
function playerHit(mon: MobDef, o: HitOpts) {
  const s = S();
  const bf: Partial<BuffState> = B?.buff ?? {};
  let m = o.mult ?? 1;
  if (o.hpScale) m *= 1 + o.hpScale * (1 - s.hp / s.hpMax);
  if (o.opener && B && (B.turnNo <= 1 || B.stunned)) m *= o.opener;
  if (o.execute && B && B.mHpMax && B.mHp / B.mHpMax < o.execute.below)
    m *= 1 + o.execute.bonus;
  const raw =
    s.pAtk * m * (o.shot ? 2 : 1) * (1 + (bf.dmg || 0)) * rand(0.85, 1.15);
  const deb = B?.mdeb?.def || 0;
  const def = mon.pDef * (1 - (o.pierce ?? 0)) * (1 - deb);
  const mit = BAL.pk / (BAL.pk + def * BAL.pd);
  let dmg = raw * mit;
  const crit = Math.random() < critChance() + (o.critBonus ?? 0) + (bf.crit || 0);
  if (crit) dmg *= 2;
  return { dmg: Math.max(1, Math.round(dmg)), crit, miss: Math.random() < 0.05 };
}
function monsterHit(mon: MobDef, heavy: boolean) {
  const s = S();
  const bf: Partial<BuffState> = B?.buff ?? {};
  const raw = mon.pAtk * (heavy ? 1.95 : 1) * rand(0.85, 1.15);
  const mit = BAL.mk / (BAL.mk + s.pDef * BAL.md);
  let dmg = raw * mit;
  const crit = Math.random() < 0.05;
  if (crit) dmg *= 1.8;
  if (B?.guard) dmg *= 0.45;
  if (bf.def) dmg *= 1 - bf.def;
  const evade = bf.evade || 0;
  const miss = Math.random() < 0.06 + evade;
  return { dmg: Math.max(1, Math.round(dmg)), crit, miss, evaded: miss && evade > 0 };
}

// ── hero attack fx (owns impact timing) ─────────────────────────
async function heroFx(kind: "attack" | "support", isSkill = false) {
  if (motionOff()) return wait(40);
  const cls = CLASSES[S().cls];
  if (kind === "support") {
    fx({ t: "pose", pose: "cast" });
    fx({ t: "spawn", cls: "aura-self", host: "hero", life: 520 });
    return wait(200);
  }
  if (cls.fx === "spell") {
    fx({ t: "pose", pose: "cast" });
    sfx("cast");
    fx({ t: "spawn", cls: "orb", host: "hero", life: 300 });
    setTimeout(() => fx({ t: "spawn", cls: "bolt", host: "arena", life: 320 }), ms(170));
    setTimeout(() => fx({ t: "spawn", cls: "burst", host: "foe", life: 360 }), ms(420));
    return wait(430);
  }
  fx({ t: "pose", pose: "lunge" });
  sfx("swing");
  const style = isSkill ? "slash gold" : S().cls === "th" ? "slash rogue" : "slash";
  setTimeout(
    () => fx({ t: "spawn", cls: style, host: "foe", life: 440, html: "<i></i><i></i><i></i>" }),
    ms(40),
  );
  return wait(285);
}

// ── expedition ─────────────────────────────────────────────────
export function champIn() {
  const run = S().run;
  if (!run) return -1;
  return CHAMP_EVERY - 1 - (run.streak % CHAMP_EVERY);
}
export function runZone(): ZoneDef | undefined {
  const run = S().run;
  return run ? ZONES.find((z) => z.id === run.zone) : undefined;
}
export function startRun(z: ZoneDef) {
  const s = S();
  s.run = { zone: z.id, streak: 0, kills: 0, adena: 0, xp: 0, sp: 0, items: {} };
  s.stats.runs++;
  save();
  sfx("ui");
  nextEncounter();
}
export function nextEncounter() {
  const z = runZone();
  const run = S().run;
  if (!z || !run) {
    S().run = null;
    return;
  }
  const mid = z.mobs[Math.floor(Math.random() * z.mobs.length)];
  if (champIn() === 0) return startBattle(mid, z, "champ");
  const elite = run.streak >= ELITE_FROM && Math.random() < ELITE_CHANCE;
  startBattle(mid, z, elite ? "elite" : null);
}
export interface RunSummary {
  kills: number;
  streak: number;
  adena: number;
  xp: number;
  sp: number;
  items: Record<number, number>;
}
export function endRun(_kind: "retreat" | "death", quiet = false): RunSummary | null {
  const r = S().run;
  if (!r) return null;
  S().run = null;
  const st = S().stats;
  st.bestStreak = Math.max(st.bestStreak, r.streak);
  st.bestRun = Math.max(st.bestRun, r.adena);
  save();
  if (!r.kills || quiet) return r.kills ? r : null;
  return r;
}
export function endBattle(kind: "flee") {
  if (!B) return;
  B.over = true;
  if (kind === "flee") {
    endRun("retreat");
    saveSoon();
  }
  battle.value = null;
  B = null;
}

// ── start a fight ──────────────────────────────────────────────
export function startBattle(
  mid: number,
  zone: ZoneDef | undefined,
  kind: "champ" | "elite" | null = null,
) {
  const base = MOBS[mid];
  const K = kind === "champ" ? CHAMP_MULT : kind ? ELITE_MULT : null;
  const m = !K
    ? { ...base }
    : {
        ...base,
        n: base.n + (kind === "champ" ? " campeón" : " élite"),
        hp: Math.round(base.hp * K.hp),
        pAtk: Math.round(base.pAtk * K.atk),
        elite: kind !== "champ",
        champ: kind === "champ",
      };
  const hp = Math.round(m.hp * (m.boss ? 1.6 : 1));
  B = {
    mid,
    zone,
    m,
    mHp: hp,
    mHpMax: hp,
    guard: false,
    stunned: false,
    queued: null,
    turnNo: 0,
    mdeb: null,
    auto: !!S().opts.auto,
    intent: { heavy: false },
    armed: !!S().opts.shots && count(shotId()) > 0,
    buff: null,
    busy: false,
    over: false,
  };
  battleLog.value = [];
  speed.value = S().opts.spd;
  rollIntent();
  const anyM = m as { champ?: boolean; elite?: boolean };
  if (anyM.champ) {
    pushLog(`El terreno se calla. Aparece ${m.n}.`, "gold");
    streakBanner("¡CAMPEÓN!", `botín ×${CHAMP_MULT.loot} · caída garantizada`);
    sfx("streak");
    flash();
  } else if (anyM.elite) {
    pushLog(`Algo más grande te corta el paso: ${m.n}.`, "gold");
  } else {
    pushLog(`Un ${m.n} salvaje aparece.`);
  }
  const run = S().run;
  if (run && run.streak > 0)
    pushLog(
      `Racha de ${run.streak} · botín +${Math.round((runMult() - 1) * 100)}%.`,
      "good",
    );
  sync();
  if (B.auto) setTimeout(autoStep, ms(700));
}

export const battleBackdrop = () => backdropKind(B?.zone);

function rollIntent() {
  if (!B) return;
  B.intent = { heavy: Math.random() < (B.m.boss ? 0.34 : 0.24) };
  if (B.intent.heavy && !B.over)
    pushLog(`El ${B.m.n} toma impulso para un golpe brutal.`, "dmg");
  sync();
}
function tickEffects() {
  if (!B) return;
  (["buff", "mdeb"] as const).forEach((k) => {
    const ef = B![k];
    if (!ef) return;
    if (ef.fresh) {
      ef.fresh = false;
      return;
    }
    ef.turns--;
    if (ef.turns <= 0) {
      B![k] = null;
      pushLog(
        k === "buff"
          ? `${ef.name || "El efecto"} se disipa.`
          : `El ${B!.m.n} recupera su defensa.`,
      );
    }
  });
}
function buffTagShort(b: BuffState) {
  if (b.def) return "BLINDAJE";
  if (b.evade) return "ESQUIVA";
  if (b.lifesteal) return "DRENAJE";
  if (b.shield) return "ESCUDO";
  if (b.crit) return "CRÍTICO";
  return "+DAÑO";
}

// ── loot ───────────────────────────────────────────────────────
export interface DropResult {
  xp: number;
  sp: number;
  adena: number;
  items: { id: number; q: number; rare: boolean }[];
  mult: number;
}
function rollDrops(): DropResult {
  const c = CLASSES[S().cls];
  const m = B!.m as MobDef & { champ?: boolean; elite?: boolean };
  const eliteM = m.champ ? CHAMP_MULT.loot : m.elite ? ELITE_MULT.loot : 1;
  const lvlM = levelMult(m.lv);
  const gainMult = runMult() * eliteM * lvlM;
  const dropMult = (c.perk ? c.perk.drop : 1) * eliteM * Math.max(1, lvlM);
  const adenaMult = (c.perk ? c.perk.adena : 1) * gainMult;
  const out: DropResult = { xp: 0, sp: 0, adena: 0, items: [], mult: gainMult };
  out.xp = Math.round(m.exp * XP_MULT * (m.boss ? 1.15 : 1) * gainMult);
  out.sp = Math.max(1, Math.round(m.sp * SP_MULT * (m.boss ? 1.3 : 1) * gainMult));
  const [alo, ahi, ach] = m.adena;
  if (chance(ach)) out.adena = Math.round(rand(alo, ahi) * adenaMult * (m.boss ? 2 : 1));
  for (const d of m.drops) {
    if (out.items.length >= 3) break;
    if (chance(d.chance * dropMult)) {
      const q = d.qlo === d.qhi ? d.qlo : d.qlo + Math.floor(Math.random() * (d.qhi - d.qlo + 1));
      out.items.push({ id: d.id, q, rare: d.chance < 1.2 });
    }
  }
  if (m.champ && !out.items.length && m.drops.length) {
    const d = m.drops[Math.floor(Math.random() * m.drops.length)];
    out.items.push({ id: d.id, q: d.qlo, rare: d.chance < 1.2 });
  }
  return out;
}

export interface LevelGain {
  lv: number;
  dHp: number;
  dMp: number;
  dAtk: number;
  dDef: number;
  dLuck: number;
  unlocked: string[];
}
function newlyLearnable(lv: number): string[] {
  return skillsOf(S().cls)
    .filter((k) => {
      const sk = SKILLS[k];
      return !sk.starter && sk.req === lv && !S().known.includes(k);
    })
    .map((k) => SKILLS[k].name);
}
function grantXp(xp: number): LevelGain[] {
  const s = S();
  s.xp += xp;
  const gains: LevelGain[] = [];
  while (s.xp >= xpToNext(s.lv)) {
    s.xp -= xpToNext(s.lv);
    s.lv++;
    const g = CLASSES[s.cls].grow;
    const grow = (k: keyof typeof g) => {
      s.frac[k] += g[k];
      const w = Math.floor(s.frac[k]);
      s.frac[k] -= w;
      return w;
    };
    const dHp = grow("hp"),
      dMp = grow("mp"),
      dAtk = grow("pAtk"),
      dDef = grow("pDef"),
      dLuck = grow("luck");
    s.base.hp += dHp;
    s.base.mp += dMp;
    s.base.pAtk += dAtk;
    s.base.pDef += dDef;
    s.base.luck += dLuck;
    recalc();
    s.hp = s.hpMax;
    s.mp = s.mpMax;
    gains.push({ lv: s.lv, dHp, dMp, dAtk, dDef, dLuck, unlocked: newlyLearnable(s.lv) });
  }
  return gains;
}

// ── victory / defeat ───────────────────────────────────────────
export interface VictoryData {
  mob: string;
  rw: DropResult;
  run: RunSummary | null;
  champNext: number;
}
export interface DefeatData {
  lost: number;
  brokenRun: RunSummary | null;
}
let _milesSeen = 0;

async function victory() {
  if (!B) return;
  B.over = true;
  B.busy = true;
  pushLog(`¡El ${B.m.n} cae!`, "good");
  const s = S();
  s.stats.kills++;
  s.bestiary[B.mid] = (s.bestiary[B.mid] || 0) + 1;
  if (B.m.boss) s.stats.raids = (s.stats.raids || 0) + 1;
  await wait(500);

  const rw = rollDrops();
  s.adena += rw.adena;
  rw.items.forEach((it) => {
    give(it.id, it.q);
    s.stats.drops += it.q;
  });
  s.sp += rw.sp;

  if (s.run) {
    s.run.streak++;
    s.run.kills++;
    s.run.adena += rw.adena;
    s.run.xp += rw.xp;
    s.run.sp += rw.sp;
    rw.items.forEach((it) => {
      s.run!.items[it.id] = (s.run!.items[it.id] || 0) + it.q;
    });
    const st = s.run.streak;
    if (st === 3 || st % 5 === 0) {
      streakBanner(`¡RACHA ${st}!`, `botín ×${runMult().toFixed(2)}`);
      sfx("streak");
    }
  }
  const gains = grantXp(rw.xp);
  save();
  sfx(gains.length ? "level" : "win");
  if (rw.items.some((i) => i.rare)) {
    flash();
    setTimeout(() => sfx("streak"), 480);
  }
  const ready = milesReady();
  if (ready > _milesSeen) streakBanner("¡HITO CUMPLIDO!", "cobralo en el pueblo");
  _milesSeen = ready;

  const run = s.run
    ? {
        kills: s.run.kills,
        streak: s.run.streak,
        adena: s.run.adena,
        xp: s.run.xp,
        sp: s.run.sp,
        items: s.run.items,
      }
    : null;
  sync();
  fx({ t: "result", kind: "victory", data: { mob: B.m.n, rw, run, champNext: champIn() } });
  if (gains.length) fx({ t: "levelup", gains });
}

async function defeat() {
  if (!B) return;
  B.over = true;
  B.busy = true;
  pushLog("Todo se vuelve negro...", "dmg");
  const s = S();
  s.stats.deaths++;
  sfx("lose");
  const lost = Math.floor(s.adena * 0.1);
  s.adena -= lost;
  const brokenRun = endRun("death", true);
  s.hp = Math.max(1, Math.ceil(s.hpMax * 0.4));
  s.mp = Math.ceil(s.mpMax * 0.4);
  save();
  await wait(800);
  sync();
  fx({ t: "result", kind: "defeat", data: { lost, brokenRun } });
}

// leave the result overlay → next fight or back to town
export function pushOn() {
  fx({ t: "closeResult" });
  if (S().run) nextEncounter();
}
export function retreatToTown() {
  endRun("retreat");
  fx({ t: "closeResult" });
  battle.value = null;
  B = null;
}
export function afterDefeat() {
  fx({ t: "closeResult" });
  battle.value = null;
  B = null;
}

// ── auto-battle ────────────────────────────────────────────────
export function toggleAuto() {
  if (!B) return;
  B.auto = !B.auto;
  S().opts.auto = B.auto;
  saveSoon();
  sfx("ui");
  sync();
  if (B.auto) autoStep();
}
function autoStop(reason: string) {
  if (!B || !B.auto) return;
  B.auto = false;
  S().opts.auto = false;
  sync();
  sfx("miss");
  fx({ t: "streak", text: "AUTO EN PAUSA", sub: reason });
}
async function autoStep() {
  if (!B || !B.auto || B.busy || B.over) return;
  const s = S();
  if (s.hp < s.hpMax * 0.3 && !count(1060) && !count(1061))
    return autoStop("poca vida y sin pociones");
  const m = B.m as { champ?: boolean };
  if (m.champ) return autoStop("apareció un campeón");
  const [a, arg] = autoChoice();
  await turn(a, arg);
}
// Picks what a reasonable player would; stops when a real decision is due.
function autoChoice(): [string, (number | string)?] {
  const s = S();
  const potId = [1061, 1060].find((id) => count(id) > 0);
  if (s.hp < s.hpMax * 0.38 && potId) return ["potion", potId];
  if (B!.intent?.heavy && s.hp < s.hpMax * 0.62) return ["guard"];
  const set = s.loadout
    .map((k) => ({ k, sk: SKILLS[k] }))
    .filter((o) => o.sk && o.sk.mp <= s.mp);
  const cura = set.find((o) => o.sk.healPct && s.hp < s.hpMax * 0.55);
  if (cura) return ["skill", cura.k];
  const efecto = set.find((o) => (o.sk.buff && !B!.buff) || (o.sk.debuff && !B!.mdeb));
  if (efecto && s.mp > s.mpMax * 0.55 && B!.mHp > B!.mHpMax * 0.35)
    return ["skill", efecto.k];
  const dmgSk = set
    .filter((o) => !o.sk.buff && !o.sk.debuff && !o.sk.healPct)
    .sort(
      (a, b) =>
        (b.sk.mult || 0) * (b.sk.hits || 1) - (a.sk.mult || 0) * (a.sk.hits || 1),
    )[0];
  if (dmgSk) return ["skill", dmgSk.k];
  return ["attack"];
}

// ── the turn loop ──────────────────────────────────────────────
export async function turn(action: string, arg?: number | string) {
  if (!B || B.busy || B.over) return;
  B.busy = true;
  B.turnNo++;
  B.guard = false;
  sync();
  const s = S();

  if (action === "flee") {
    if (Math.random() * 100 < fleeOdds()) {
      sfx("ui");
      pushLog("Escapás hacia el pueblo.");
      await wait(700);
      return endBattle("flee");
    }
    sfx("miss");
    pushLog("No lográs escapar.", "dmg");
    await wait(600);
  } else if (action === "guard") {
    B.guard = true;
    const rec = Math.min(s.mpMax - s.mp, Math.max(4, Math.round(s.mpMax * 0.08)));
    s.mp += rec;
    sfx("ui");
    pushLog("Te cubrís tras el escudo.");
    if (rec > 0) popup("+" + rec, "mp", "hero");
    sync();
    await wait(500);
  } else if (action === "potion") {
    const id = arg as number;
    const h = potionHeal(id);
    take(id, 1);
    s.hp = Math.min(s.hpMax, s.hp + h);
    sfx("heal");
    pushLog(`Bebés ${ITEMS[id].n}. +${h} PV.`, "good");
    popup("+" + h, "heal", "hero");
    sync();
    await wait(600);
  } else if (action === "attack" || action === "skill") {
    const isSkill = action === "skill";
    const sk = isSkill ? SKILLS[arg as string] : null;
    if (isSkill && sk) s.mp -= sk.mp;

    let shot = false;
    const damaging = !isSkill || (!sk!.healPct && !sk!.buff && !sk!.debuff);
    if (B.armed && damaging) {
      const sid = shotId();
      if (count(sid) > 0) {
        take(sid, 1);
        shot = true;
      } else {
        B.armed = false;
        s.opts.shots = false;
        pushLog(`Te quedaste sin ${shotName()}.`);
      }
    }

    let tail = 600;
    if (isSkill && sk!.healPct) {
      await heroFx("support");
      const h = Math.round(s.hpMax * sk!.healPct);
      s.hp = Math.min(s.hpMax, s.hp + h);
      sfx("heal");
      pushLog(`¡${sk!.name}! Recuperás ${h} PV.`, "good");
      popup("+" + h, "heal", "hero");
    } else if (isSkill && sk!.buff) {
      await heroFx("support");
      B.buff = { ...sk!.buff!, name: sk!.name, fresh: true };
      sfx("skill");
      pushLog(`¡${sk!.name}! ${sk!.txt}.`, "gold");
      popup(buffTagShort(sk!.buff!), "mp", "hero");
    } else if (isSkill && sk!.debuff && !sk!.mult) {
      await heroFx("support");
      B.mdeb = { ...sk!.debuff!, name: sk!.name, fresh: true };
      sfx("skill");
      pushLog(`¡${sk!.name}! ${sk!.txt}.`, "gold");
      popup("−DEF", "crit", "mob");
    } else {
      const hits = (isSkill && sk!.hits) || 1;
      const opt: HitOpts = isSkill
        ? {
            mult: sk!.mult,
            pierce: sk!.pierce || 0,
            critBonus: sk!.critBonus || 0,
            shot,
            hpScale: sk!.hpScale || 0,
            execute: sk!.execute || null,
            opener: sk!.opener || 0,
          }
        : { mult: 1.4, shot };
      if (isSkill) {
        sfx("skill");
        pushLog(`¡${sk!.name}!${shot ? " (" + shotName().toLowerCase() + ")" : ""}`, "gold");
      }
      let total = 0,
        anyCrit = false,
        anyHit = false;
      for (let i = 0; i < hits; i++) {
        await heroFx("attack", isSkill);
        const r = playerHit(B.m, opt);
        if (r.miss) {
          pushLog("Fallás el golpe.");
          popup("MISS", "", "mob");
          sfx("miss");
          continue;
        }
        anyHit = true;
        anyCrit = anyCrit || r.crit;
        total += r.dmg;
        B.mHp = Math.max(0, B.mHp - r.dmg);
        const pw = Math.min(1, r.dmg / Math.max(1, B.mHpMax * 0.5));
        sfx(r.crit ? "crit" : "hit");
        if (r.crit) flash(true);
        hitFx("mob");
        sparks(
          "mob",
          r.crit,
          pw,
          isSkill
            ? sk!.kind === "magic"
              ? "magic"
              : "phys"
            : CLASSES[s.cls].fx === "spell"
              ? "magic"
              : "phys",
        );
        shake(r.crit ? 1.7 : 0.5 + pw);
        popup(r.crit ? "¡" + r.dmg + "!" : String(r.dmg), r.crit ? "crit" : "", "mob");
        sync();
        await hitstop(r.crit ? 95 : 50);
        if (hits > 1 && i < hits - 1) await wait(110);
      }
      tail = 300;
      if (anyHit) {
        s.stats.best = Math.max(s.stats.best, total);
        pushLog(
          `${anyCrit ? "CRÍTICO — " : ""}${total} de daño${
            shot && !isSkill ? " (" + shotName().toLowerCase() + ")" : ""
          }${hits > 1 ? " (" + hits + " golpes)" : ""}.`,
          "dmg",
        );
        const steal = (isSkill && sk!.lifesteal) || B.buff?.lifesteal || 0;
        if (steal) {
          const heal = Math.min(Math.round(total * steal), s.hpMax - s.hp);
          if (heal > 0) {
            s.hp += heal;
            pushLog(`Drenás ${heal} PV.`, "good");
            popup("+" + heal, "heal", "hero");
          }
        }
        if (isSkill && sk!.stun && B.mHp > 0) {
          B.stunned = true;
          pushLog(`¡El ${B.m.n} queda aturdido!`, "gold");
        }
        if (isSkill && sk!.debuff && B.mHp > 0) {
          B.mdeb = { ...sk!.debuff!, name: sk!.name, fresh: true };
          pushLog(`La defensa del ${B.m.n} queda abierta.`, "gold");
        }
      }
    }
    sync();
    await wait(tail);
  }

  if (B.mHp <= 0) return victory();

  // monster action
  if (B.stunned) {
    B.stunned = false;
    pushLog(`El ${B.m.n} está aturdido y pierde el turno.`);
    await wait(650);
  } else {
    const heavy = !!B.intent?.heavy;
    await wait(heavy ? 520 : 220);
    const mr = monsterHit(B.m, heavy);
    if (mr.miss) {
      sfx("miss");
      if (mr.evaded) {
        popup("ESQUIVA", "", "hero");
        pushLog("Te escurrís: el golpe pasa de largo.", "good");
      } else pushLog(`El ${B.m.n} falla.`);
    } else {
      let dmg = mr.dmg,
        absorbed = 0;
      if (B.buff?.shield && s.mp > 0) {
        const rate = B.buff.shield;
        absorbed = Math.min(dmg, Math.floor(s.mp / rate));
        if (absorbed > 0) {
          s.mp -= absorbed * rate;
          dmg -= absorbed;
        }
      }
      s.hp = Math.max(0, s.hp - dmg);
      const pw = Math.min(1, dmg / Math.max(1, s.hpMax * 0.4));
      sfx("hurt");
      if (mr.crit) flash(true);
      hitFx("hero");
      if (dmg > 0) {
        sparks("hero", mr.crit, pw, "phys");
        shake(mr.crit ? 1.9 : 0.6 + pw);
      }
      if (absorbed > 0) popup("−" + absorbed * (B.buff!.shield || 1) + " PM", "mp", "hero");
      if (dmg > 0) popup(String(dmg), mr.crit ? "crit" : "", "hero");
      if (dmg > 0) await hitstop(mr.crit ? 95 : 45);
      pushLog(
        absorbed > 0
          ? `El escudo arcano absorbe ${absorbed}${dmg > 0 ? ` y te hace ${dmg}` : ""}.`
          : `${mr.crit ? "El golpe te parte — " : ""}El ${B.m.n} te hace ${dmg}${
              B.guard ? " (cubierto)" : ""
            }.`,
        absorbed > 0 ? "" : "dmg",
      );
    }
  }
  B.guard = false;
  tickEffects();
  rollIntent();
  sync();
  await wait(500);

  if (s.hp <= 0) return defeat();

  if (s.mp < s.mpMax) {
    const gained = Math.min(mpRegen(), s.mpMax - s.mp);
    s.mp += gained;
    if (gained > 0) popup("+" + gained, "mp", "hero");
  }
  B.busy = false;
  saveSoon();
  sync();
  if (B.queued) {
    const q = B.queued;
    B.queued = null;
    setTimeout(q, ms(80));
  } else if (B.auto) {
    setTimeout(autoStep, ms(220));
  }
}

export function fleeOdds() {
  return Math.round(
    Math.max(25, Math.min(95, (0.6 + (S().lv - B!.m.lv) * 0.03) * 100)),
  );
}
export function potionHeal(id: number): number {
  const base: Record<number, number> = { 1060: 45, 1061: 120 };
  const pct: Record<number, number> = { 1060: 0.18, 1061: 0.42 };
  if (!base[id]) return 0;
  return Math.max(base[id], Math.round(S().hpMax * (pct[id] || 0)));
}
export function cycleSpeed() {
  speed.value = (speed.value >= 3 ? 1 : speed.value + 1) as 1 | 2 | 3;
  S().opts.spd = speed.value;
  saveSoon();
  sfx("ui");
}
export function toggleShot() {
  if (!B) return;
  B.armed = !B.armed;
  S().opts.shots = B.armed;
  saveSoon();
  sfx("ui");
  sync();
}
export function queueAction(fn: () => void) {
  if (!B) return;
  B.queued = fn;
  sfx("ui");
}
export const getB = () => B;
