// ── Game-design layer ────────────────────────────────────────────────
// Everything here is authored tuning: zone flavour, class curves, skill
// effects, gear bonuses, shop stock, drop curation. The encyclopaedic
// facts — monster stats, item names, icons, drop chances/quantities,
// adena ranges — come from the l2api.dev snapshot and are merged in
// src/data/index.ts. Names of skills/classes are real Interlude English
// names; never translated.

export type ClassKey = "glad" | "sorc" | "th";
export type SkillKind = "phys" | "magic" | "support";
export type SpriteKey =
  | "gremlin"
  | "wolf"
  | "goblin"
  | "orc"
  | "skeleton"
  | "spider"
  | "hangman"
  | "keltir"
  | "lizardman"
  | "bear"
  | "mandragora"
  | "golem";

// ── equipment ───────────────────────────────────────────────────────
export type GearSlot = "wpn" | "arm" | "shd" | "acc";

export const SLOTS: { k: GearSlot; label: string; empty: string }[] = [
  { k: "wpn", label: "Arma", empty: "Puños" },
  { k: "arm", label: "Armadura", empty: "Ropa de viaje" },
  { k: "shd", label: "Escudo", empty: "Sin escudo" },
  { k: "acc", label: "Joya", empty: "Sin joya" },
];
export const SLOT_LABEL: Record<GearSlot, string> = {
  wpn: "Arma",
  arm: "Armadura",
  shd: "Escudo",
  acc: "Joya",
};
export const STAT_LABEL: Record<string, string> = {
  pAtk: "P.ATK",
  pDef: "P.DEF",
  luck: "SUERTE",
  hp: "PV",
  mp: "PM",
};

export interface GearDef {
  slot: GearSlot;
  b: Partial<Record<"pAtk" | "pDef" | "luck" | "hp" | "mp", number>>;
}
// Bonuses the item confers. hp/mp are maximums. Keyed by real item id.
export const GEAR: Record<number, GearDef> = {
  1: { slot: "wpn", b: { pAtk: 3 } }, // Short Sword
  10: { slot: "wpn", b: { pAtk: 3, luck: 2 } }, // Dagger
  8: { slot: "wpn", b: { pAtk: 2, mp: 10 } }, // Willow Staff
  13: { slot: "wpn", b: { pAtk: 5 } }, // Short Bow
  3: { slot: "wpn", b: { pAtk: 12 } }, // Broadsword
  257: { slot: "wpn", b: { pAtk: 21, luck: 5 } }, // Viper's Fang
  43: { slot: "arm", b: { pDef: 4 } }, // Wooden Helmet
  49: { slot: "arm", b: { pDef: 3, luck: 1 } }, // Gloves
  37: { slot: "arm", b: { pDef: 2, luck: 3 } }, // Leather Shoes
  393: { slot: "arm", b: { pDef: 16, hp: 20, luck: -1 } }, // Mithril Banded Mail
  20: { slot: "shd", b: { pDef: 6 } }, // Buckler
  116: { slot: "acc", b: { mp: 8 } }, // Magic Ring
  112: { slot: "acc", b: { luck: 2 } }, // Apprentice's Earring
  118: { slot: "acc", b: { mp: 12, luck: 2 } }, // Necklace of Magic
};

// ── monsters: art + which drops to surface ──────────────────────────
export interface MobTune {
  art: SpriteKey;
  variant?: boolean; // alt palette (e.g. Dire Wolf uses the wolf sprite recoloured)
  boss?: boolean;
  // ordered subset of the real drop table to show; [] = adena only.
  dropIds: number[];
}
// `dropIds` = an ordered subset of the real drop table to surface. Leave it
// empty ([]) and src/data/index.ts auto-picks the top drops by chance.
export const MOB_TUNE: Record<number, MobTune> = {
  18342: { art: "gremlin", dropIds: [] },
  20481: { art: "keltir", dropIds: [] },
  20432: { art: "keltir", variant: true, dropIds: [] },
  20120: { art: "wolf", dropIds: [1864, 1060, 1870, 13] },
  20003: { art: "goblin", dropIds: [116, 112, 118, 1873] },
  20468: { art: "goblin", variant: true, dropIds: [] },
  20132: { art: "wolf", dropIds: [] },
  20093: { art: "orc", dropIds: [1060, 1872, 2005, 3] },
  20008: { art: "lizardman", dropIds: [] },
  20022: { art: "skeleton", dropIds: [1864, 1869, 1831, 20, 43] },
  20103: { art: "spider", dropIds: [1867, 1872, 1871, 49, 37] },
  20479: { art: "bear", dropIds: [] },
  20109: { art: "lizardman", variant: true, dropIds: [] },
  20147: { art: "goblin", dropIds: [] },
  20154: { art: "mandragora", dropIds: [] },
  20053: { art: "orc", variant: true, dropIds: [] },
  20205: { art: "wolf", variant: true, dropIds: [1868, 6037, 1873, 2255, 257] },
  20495: { art: "orc", dropIds: [] },
  20083: { art: "golem", dropIds: [] },
  20192: { art: "bear", variant: true, dropIds: [] },
  20144: { art: "hangman", boss: true, dropIds: [6667, 1880, 1875, 2272, 393] },
};

// ── zones (hunting grounds) ─────────────────────────────────────────
export interface ZoneDef {
  id: string;
  region: string;
  name: string;
  band: [number, number];
  desc: string;
  mobs: number[];
  boss?: boolean;
}
export const ZONES: ZoneDef[] = [
  {
    id: "elder",
    region: "Isla del Diálogo",
    name: "Bosque Antiguo",
    band: [1, 4],
    desc: "Los primeros pasos. Keltirs y elpys entre robles viejos.",
    mobs: [18342, 20481, 20432],
  },
  {
    id: "obelisk",
    region: "Isla del Diálogo",
    name: "Obelisco de la Victoria",
    band: [4, 8],
    desc: "Lobos y goblins merodean la piedra. Ya no es un paseo.",
    mobs: [20120, 20003],
  },
  {
    id: "kaboo",
    region: "Gludin",
    name: "Cuevas Kaboo",
    band: [6, 10],
    desc: "Orcos Kaboo y hombres lobo en la oscuridad húmeda.",
    mobs: [20468, 20132],
  },
  {
    id: "despair",
    region: "Gludio",
    name: "Ruinas de la Desesperación",
    band: [9, 14],
    desc: "Orcos y muertos vivientes bajo arcos derrumbados.",
    mobs: [20093, 20022],
  },
  {
    id: "agony",
    region: "Gludio",
    name: "Ruinas de la Agonía",
    band: [13, 18],
    desc: "Telarañas del tamaño de un hombre y lagartos de piedra.",
    mobs: [20022, 20103, 20008],
  },
  {
    id: "wastelands",
    region: "Gludio",
    name: "Tierras Baldías",
    band: [15, 20],
    desc: "Osos kasha y salamandras rojas en el yermo agrietado.",
    mobs: [20479, 20109],
  },
  {
    id: "cruma",
    region: "Dion",
    name: "Marismas de Cruma",
    band: [20, 25],
    desc: "Mandrágoras que gritan al arrancarlas. Hobgoblins acechan el barro.",
    mobs: [20154, 20147],
  },
  {
    id: "tanor",
    region: "Dion",
    name: "Sendero del Cañón Tanor",
    band: [22, 28],
    desc: "Lobos huargos y patrullas Ol Mahum cazan por el desfiladero.",
    mobs: [20205, 20053],
  },
  {
    id: "outlaw",
    region: "Dion",
    name: "Refugio de Forajidos",
    band: [28, 34],
    desc: "Señores orcos Turek y gólems de granito guardan el escondite.",
    mobs: [20495, 20083],
  },
  {
    id: "exec",
    region: "Dion",
    name: "Campos de Ejecución",
    band: [33, 99],
    boss: true,
    desc: "El Tyrant ronda entre las horcas donde se alimenta el Hangman Tree.",
    mobs: [20144, 20192],
  },
];

// ── classes ────────────────────────────────────────────────────────
export interface ClassDef {
  key: ClassKey;
  name: string;
  tag: string;
  wpn: number; // item id worn in the portrait
  start: string; // starter skill key
  shot: number; // ammo item id
  fx: "melee" | "spell";
  desc: string;
  path: string;
  base: { hp: number; mp: number; pAtk: number; pDef: number; luck: number };
  grow: { hp: number; mp: number; pAtk: number; pDef: number; luck: number };
  perk?: { drop: number; adena: number };
}
export const CLASSES: Record<ClassKey, ClassDef> = {
  glad: {
    key: "glad",
    name: "Gladiator",
    tag: "HUMANO · GUERRERO",
    wpn: 1,
    start: "pow",
    shot: 1835,
    fx: "melee",
    desc: "Aguanta los golpes y devuelve el doble. La senda del acero.",
    path: "Encadena golpes y se sostiene solo: baja el daño que recibe, se cura con lo que pega y golpea hasta tres veces por turno.",
    base: { hp: 60, mp: 12, pAtk: 12, pDef: 10, luck: 5 },
    grow: { hp: 14, mp: 2, pAtk: 2.2, pDef: 1.6, luck: 0.3 },
  },
  sorc: {
    key: "sorc",
    name: "Sorcerer",
    tag: "HUMANO · MAGO",
    wpn: 8,
    start: "wind",
    shot: 2509,
    fx: "spell",
    desc: "Frágil como el cristal, letal como la tormenta.",
    path: "Abre la defensa del enemigo y la revienta. Su PM no es sólo munición: con el escudo arcano es una segunda barra de vida.",
    base: { hp: 38, mp: 34, pAtk: 7, pDef: 6, luck: 6 },
    grow: { hp: 11, mp: 7, pAtk: 1.8, pDef: 1.2, luck: 0.4 },
  },
  th: {
    key: "th",
    name: "Treasure Hunter",
    tag: "ELFO OSCURO · PÍCARO",
    wpn: 10,
    start: "stab",
    shot: 1835,
    fx: "melee",
    desc: "Vive del botín. Más golpes críticos y más caídas de objetos.",
    path: "Abre por la espalda, esquiva lo que no puede aguantar y remata al herido. Además encuentra más botín que nadie.",
    base: { hp: 46, mp: 18, pAtk: 9, pDef: 7, luck: 14 },
    grow: { hp: 10, mp: 4, pAtk: 1.7, pDef: 1.2, luck: 0.8 },
    perk: { drop: 1.7, adena: 1.3 },
  },
};

// ── skills ─────────────────────────────────────────────────────────
export interface SkillDef {
  name: string;
  cls: ClassKey | null;
  kind: SkillKind;
  mp: number;
  txt: string;
  starter?: ClassKey;
  cost?: number;
  req?: number;
  mult?: number;
  hits?: number;
  pierce?: number;
  critBonus?: number;
  healPct?: number;
  lifesteal?: number;
  stun?: boolean;
  hpScale?: number;
  opener?: number;
  buff?: {
    dmg?: number;
    def?: number;
    crit?: number;
    evade?: number;
    lifesteal?: number;
    shield?: number;
    turns: number;
  };
  debuff?: { def: number; turns: number };
  execute?: { below: number; bonus: number };
}
export const SKILLS: Record<string, SkillDef> = {
  heal: {
    name: "Heal",
    cls: null,
    kind: "support",
    mp: 9,
    healPct: 0.45,
    txt: "cura 45% de tu PV máx",
    cost: 35,
    req: 3,
  },
  // Gladiator
  pow: {
    name: "Power Strike",
    cls: "glad",
    kind: "phys",
    mp: 4,
    mult: 1.9,
    txt: "x1.9 al daño físico",
    starter: "glad",
  },
  twin: {
    name: "Double Sonic Slash",
    cls: "glad",
    kind: "phys",
    mp: 8,
    hits: 2,
    mult: 1.15,
    txt: "golpea 2 veces (x1.15 c/u)",
    cost: 60,
    req: 6,
  },
  barr: {
    name: "Sonic Barrier",
    cls: "glad",
    kind: "support",
    mp: 9,
    buff: { def: 0.45, turns: 3 },
    txt: "−45% al daño recibido por 3 turnos",
    cost: 200,
    req: 11,
  },
  cry: {
    name: "War Cry",
    cls: "glad",
    kind: "support",
    mp: 6,
    buff: { dmg: 0.45, turns: 3 },
    txt: "+45% a tu daño por 3 turnos",
    cost: 500,
    req: 15,
  },
  vamp: {
    name: "Vampiric Rage",
    cls: "glad",
    kind: "support",
    mp: 10,
    buff: { lifesteal: 0.2, turns: 3 },
    txt: "por 3 turnos te curás ⅕ de lo que pegás",
    cost: 1100,
    req: 20,
  },
  triple: {
    name: "Triple Sonic Slash",
    cls: "glad",
    kind: "phys",
    mp: 14,
    hits: 3,
    mult: 1.3,
    txt: "golpea 3 veces (x1.3 c/u)",
    cost: 2400,
    req: 25,
  },
  rage: {
    name: "Rage",
    cls: "glad",
    kind: "phys",
    mp: 10,
    mult: 1.7,
    hpScale: 1.7,
    txt: "x1.7, y hasta x3.4 con la vida al mínimo",
    cost: 5000,
    req: 31,
  },
  // Sorcerer
  wind: {
    name: "Wind Strike",
    cls: "sorc",
    kind: "magic",
    mp: 6,
    mult: 2.7,
    pierce: 0.5,
    txt: "x2.7, ignora ½ defensa",
    starter: "sorc",
  },
  blaze: {
    name: "Blaze",
    cls: "sorc",
    kind: "magic",
    mp: 8,
    mult: 2.9,
    txt: "x2.9 de daño de fuego",
    cost: 60,
    req: 6,
  },
  surr: {
    name: "Surrender to Fire",
    cls: "sorc",
    kind: "magic",
    mp: 8,
    mult: 1.4,
    debuff: { def: 0.5, turns: 4 },
    txt: "x1.4 y deja la defensa del enemigo −50% por 4 turnos",
    cost: 200,
    req: 11,
  },
  circle: {
    name: "Blazing Circle",
    cls: "sorc",
    kind: "magic",
    mp: 13,
    hits: 2,
    mult: 1.6,
    pierce: 0.3,
    txt: "2 llamaradas x1.6 que ignoran ⅓ de defensa",
    cost: 500,
    req: 15,
  },
  shield: {
    name: "Arcane Shield",
    cls: "sorc",
    kind: "support",
    mp: 10,
    buff: { shield: 1, turns: 4 },
    txt: "por 4 turnos el daño te lo paga el PM (1 PM por PV)",
    cost: 1100,
    req: 20,
  },
  volcano: {
    name: "Volcano",
    cls: "sorc",
    kind: "support",
    mp: 12,
    buff: { dmg: 0.7, turns: 3 },
    txt: "+70% a tu daño por 3 turnos",
    cost: 2400,
    req: 25,
  },
  nova: {
    name: "Prominence",
    cls: "sorc",
    kind: "magic",
    mp: 16,
    mult: 5.4,
    txt: "x5.4 de daño arcano",
    cost: 5000,
    req: 31,
  },
  // Treasure Hunter
  stab: {
    name: "Deadly Blow",
    cls: "th",
    kind: "phys",
    mp: 5,
    mult: 2.3,
    critBonus: 0.35,
    txt: "x2.3 y +crítico",
    starter: "th",
  },
  back: {
    name: "Backstab",
    cls: "th",
    kind: "phys",
    mp: 7,
    mult: 2.4,
    opener: 1.7,
    txt: "x2.4, y x4.1 en el primer turno o contra un aturdido",
    cost: 60,
    req: 6,
  },
  evade: {
    name: "Ultimate Evasion",
    cls: "th",
    kind: "support",
    mp: 9,
    buff: { evade: 0.55, turns: 3 },
    txt: "+55% de esquiva por 3 turnos",
    cost: 200,
    req: 11,
  },
  blind: {
    name: "Blinding Blow",
    cls: "th",
    kind: "phys",
    mp: 8,
    mult: 1.5,
    stun: true,
    txt: "x1.5 y el enemigo pierde el turno",
    cost: 500,
    req: 15,
  },
  drain: {
    name: "Vampiric Touch",
    cls: "th",
    kind: "magic",
    mp: 11,
    mult: 2.0,
    lifesteal: 0.5,
    txt: "x2.0 y te curás ½ del daño",
    cost: 1100,
    req: 20,
  },
  lucky: {
    name: "Lucky Strike",
    cls: "th",
    kind: "support",
    mp: 8,
    buff: { crit: 0.35, turns: 3 },
    txt: "+35% de crítico por 3 turnos",
    cost: 2400,
    req: 25,
  },
  mortal: {
    name: "Mortal Blow",
    cls: "th",
    kind: "phys",
    mp: 13,
    mult: 2.8,
    execute: { below: 0.35, bonus: 1.2 },
    txt: "x2.8, y más del doble si al enemigo le queda menos de ⅓",
    cost: 5000,
    req: 31,
  },
};

// ── shop ───────────────────────────────────────────────────────────
export const SHOP: { id: number; buy: number; cls?: ClassKey[] }[] = [
  { id: 1060, buy: 90 },
  { id: 1061, buy: 330 },
  { id: 1835, buy: 14, cls: ["glad", "th"] },
  { id: 2509, buy: 20, cls: ["sorc"] },
];
export const SHOP_GEAR: { id: number; buy: number; req: number }[] = [
  { id: 116, buy: 33, req: 1 },
  { id: 112, buy: 49, req: 1 },
  { id: 118, buy: 66, req: 1 },
  { id: 1, buy: 100, req: 1 },
  { id: 10, buy: 100, req: 1 },
  { id: 8, buy: 100, req: 1 },
  { id: 13, buy: 768, req: 6 },
  { id: 49, buy: 2650, req: 6 },
  { id: 37, buy: 2650, req: 6 },
  { id: 20, buy: 2780, req: 10 },
  { id: 43, buy: 3980, req: 10 },
  { id: 3, buy: 12500, req: 16 },
  { id: 393, buy: 145000, req: 22 }, // Mithril Banded Mail (D grade) — endgame adena sink
];

// Potions: fixed Interlude base with a percentage floor, so a potion still
// matters at level 30.
export const POTION_HEAL: Record<number, number> = { 1060: 45, 1061: 120 };
export const POTION_PCT: Record<number, number> = { 1060: 0.18, 1061: 0.42 };

// ── item type labels (Spanish UI) — keyed by API `category` shape ───
// The API gives structured category info; we map it to a short Spanish
// label for the inventory grouping. Falls back to a generic label.
export const JUNK_TYPES = ["material", "pieza", "receta", "pergamino", "llave"];

// ── global tuning ──────────────────────────────────────────────────
export const SP_MULT = 2.4;
export const XP_MULT = 1.7;
export const SP_PER_XP = (0.043 * SP_MULT) / XP_MULT;

export const RUN_STEP = 0.1;
export const RUN_CAP = 1.0;
export const ELITE_FROM = 3;
export const ELITE_CHANCE = 0.18;
export const ELITE_MULT = { hp: 1.6, atk: 1.45, loot: 2.2 };
export const CHAMP_EVERY = 10;
export const CHAMP_MULT = { hp: 2.2, atk: 1.75, loot: 3.5 };

export const LVL_BONUS_PER = 0.1;
export const LVL_BONUS_CAP = 1.2;
export const LVL_MALUS_PER = 0.09;
export const LVL_MALUS_FLOOR = 0.25;

export const SAVE_KEY = "returnToAden.v1"; // key kept so v1 saves are found
export const SAVE_V = 4;
