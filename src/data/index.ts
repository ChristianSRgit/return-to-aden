// ── Merged data layer ───────────────────────────────────────────────
// Combines the l2api.dev build snapshot (real names / stats / icons /
// drop tables) with the authored tuning in curated.ts. Everything the
// game reads at runtime comes from here. src/data/refresh.ts can patch
// the snapshot-derived fields in place after a background revalidation.

import monstersRaw from "./generated/monsters.json";
import dropsRaw from "./generated/drops.json";
import itemsRaw from "./generated/items.json";
import meta from "./generated/snapshot.meta.json";
import {
  GEAR,
  MOB_TUNE,
  CLASSES,
  SKILLS,
  ZONES,
  SHOP,
  SHOP_GEAR,
  type ClassKey,
  type SpriteKey,
} from "./curated";

export * from "./curated";
export const SNAPSHOT_META = meta;

// ── raw snapshot shapes (only the fields we use) ───────────────────
interface RawMonster {
  id: number;
  name: string;
  level: number;
  race: string;
  raceIconFile?: string;
  stats: { hp: number; exp: number; sp: number; pAtk: number; pDef: number };
}
interface RawDrop {
  itemId: number;
  qty: string;
  chance: number;
  type: "regular" | "spoil" | "adena";
}
interface RawItem {
  id: number;
  name: string;
  type: "weapon" | "armor" | "etcitem";
  grade: string;
  price: number;
  iconFile: string;
  category?: {
    bodypart?: string;
    etcItemType?: string;
    weaponType?: string;
  };
}

const RAW_MONSTERS = monstersRaw as unknown as Record<string, RawMonster>;
const RAW_DROPS = dropsRaw as unknown as Record<string, RawDrop[]>;
const RAW_ITEMS = itemsRaw as unknown as Record<string, RawItem>;

// ── item type → Spanish UI label ──────────────────────────────────
function itemTypeLabel(it: RawItem): string {
  if (it.id === 57) return "moneda";
  const name = it.name.toLowerCase();
  if (name.includes("soulshot") || name.includes("spiritshot")) return "munición";
  if (name.startsWith("recipe:")) return "receta";
  if (name.includes(" key") || name.endsWith("key")) return "llave";
  if (it.type === "weapon") return "arma";
  if (it.type === "armor") {
    const bp = it.category?.bodypart ?? "";
    if (bp === "Off-hand") return "escudo";
    if (["Ring", "Earring", "Necklace"].includes(bp)) return "joya";
    return "armadura";
  }
  const et = it.category?.etcItemType;
  if (et === "potion") return "poción";
  if (et === "recipe") return "receta";
  if (et === "scroll") return "pergamino";
  if (et === "arrow") return "munición";
  return "material";
}

function parseQty(q: string): [number, number] {
  const m = q.replace(/[–—]/g, "-").match(/(\d+)\s*-\s*(\d+)/);
  if (m) return [Number(m[1]), Number(m[2])];
  const n = Number(q.replace(/[^\d]/g, "")) || 1;
  return [n, n];
}

// ── ITEMS ─────────────────────────────────────────────────────────
export interface ItemDef {
  id: number;
  n: string; // English name, verbatim from the API
  t: string; // Spanish type label
  g: string; // grade
  ic: string; // icon filename
  price: number;
}
export const ITEMS: Record<number, ItemDef> = {};
for (const it of Object.values(RAW_ITEMS)) {
  ITEMS[it.id] = {
    id: it.id,
    n: it.name,
    t: itemTypeLabel(it),
    g: it.grade || "none",
    ic: it.iconFile,
    price: it.price || 0,
  };
}
export const itemName = (id: number) => ITEMS[id]?.n ?? `Item #${id}`;
export const iconUrl = (file: string | undefined) =>
  file ? `${import.meta.env.BASE_URL}icons/${file}` : "";
export const itemIcon = (id: number) => iconUrl(ITEMS[id]?.ic);

// ── DROPS ─────────────────────────────────────────────────────────
export interface DropDef {
  id: number;
  qlo: number;
  qhi: number;
  chance: number; // percent, as the API returns it
  spoil: boolean;
}
function dropsFor(mid: number): { drops: DropDef[]; adena: [number, number, number] } {
  const rows = RAW_DROPS[String(mid)] ?? [];
  const tune = MOB_TUNE[mid];
  const byId = new Map<number, RawDrop>();
  let adena: [number, number, number] = [0, 0, 0];
  for (const r of rows) {
    if (r.type === "adena") {
      const [lo, hi] = parseQty(r.qty);
      adena = [lo, hi, r.chance];
    } else {
      // keep the highest-chance row for each item id
      const prev = byId.get(r.itemId);
      if (!prev || r.chance > prev.chance) byId.set(r.itemId, r);
    }
  }
  const toDrop = (id: number, r: RawDrop): DropDef => {
    const [qlo, qhi] = parseQty(r.qty);
    return { id, qlo, qhi, chance: r.chance, spoil: r.type === "spoil" };
  };
  const drops: DropDef[] = [];
  const curated = tune?.dropIds ?? [];
  if (curated.length) {
    for (const id of curated) {
      const r = byId.get(id);
      if (r && ITEMS[id]) drops.push(toDrop(id, r));
    }
  } else {
    // auto-curate: the 4 likeliest real drops, biggest chance first
    for (const [id, r] of [...byId.entries()]
      .filter(([id]) => ITEMS[id])
      .sort((a, b) => b[1].chance - a[1].chance)
      .slice(0, 4)) {
      drops.push(toDrop(id, r));
    }
  }
  return { drops, adena };
}

// ── MOBS ──────────────────────────────────────────────────────────
export interface MobDef {
  id: number;
  n: string;
  lv: number;
  race: string;
  raceIcon?: string;
  hp: number;
  exp: number;
  sp: number;
  pAtk: number;
  pDef: number;
  boss: boolean;
  art: SpriteKey;
  variant: boolean;
  adena: [number, number, number];
  drops: DropDef[];
}
export const MOBS: Record<number, MobDef> = {};
for (const [idStr, tune] of Object.entries(MOB_TUNE)) {
  const id = Number(idStr);
  const raw = RAW_MONSTERS[idStr];
  if (!raw) continue;
  const { drops, adena } = dropsFor(id);
  MOBS[id] = {
    id,
    n: raw.name,
    lv: raw.level,
    race: raw.race,
    raceIcon: raw.raceIconFile,
    hp: raw.stats.hp,
    exp: raw.stats.exp,
    sp: raw.stats.sp,
    pAtk: raw.stats.pAtk,
    pDef: raw.stats.pDef,
    boss: !!tune.boss,
    art: tune.art,
    variant: !!tune.variant,
    adena,
    drops,
  };
}

// ── rare-drop detection (for UI glow) ─────────────────────────────
const RARE_IDS = new Set<number>();
for (const m of Object.values(MOBS))
  for (const d of m.drops) if (d.chance < 1.2) RARE_IDS.add(d.id);
export const isRareItem = (id: number) => RARE_IDS.has(id);

// ── skills helpers ───────────────────────────────────────────────
export function skillsOf(cls: ClassKey): string[] {
  return Object.keys(SKILLS)
    .filter((k) => SKILLS[k].cls === null || SKILLS[k].cls === cls)
    .sort((a, b) => (SKILLS[a].req || 0) - (SKILLS[b].req || 0));
}
export function skillFits(k: string, cls: ClassKey): boolean {
  const sk = SKILLS[k];
  return !!sk && (sk.cls === null || sk.cls === cls);
}

// re-exports used across the app
export { GEAR, CLASSES, SKILLS, ZONES, SHOP, SHOP_GEAR };
export type { ClassKey, SpriteKey };
