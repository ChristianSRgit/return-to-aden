import { GEAR, ITEMS, STAT_LABEL, type GearSlot } from "../data";
import { S, take, give, count, recalc, save, touch } from "./state";
import { sfx } from "./audio";
import { toast } from "../ui/overlays";
import type { ComponentChildren } from "preact";

export function gearLine(id: number): string {
  const g = GEAR[id];
  if (!g) return "";
  return Object.entries(g.b)
    .map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${STAT_LABEL[k]}`)
    .join(" · ");
}

// The stat delta between an item and whatever is already in its slot.
export function gearCompare(id: number): ComponentChildren {
  const g = GEAR[id];
  if (!g) return "";
  const curId = S().gear[g.slot];
  const cur = curId != null ? GEAR[curId] : undefined;
  const keys = new Set([
    ...Object.keys(g.b),
    ...(cur ? Object.keys(cur.b) : []),
  ]);
  const parts: ComponentChildren[] = [];
  for (const k of keys) {
    const d =
      ((g.b as Record<string, number>)[k] || 0) -
      (cur ? (cur.b as Record<string, number>)[k] || 0 : 0);
    if (!d) continue;
    parts.push(
      <span style={`color:${d > 0 ? "var(--ok)" : "var(--crit)"}`}>
        {d > 0 ? "+" : ""}
        {d} {STAT_LABEL[k]}
      </span>,
    );
  }
  if (!parts.length) return <span class="muted">Mismo rendimiento</span>;
  return parts.flatMap((p, i) => (i ? [" · ", p] : [p]));
}

export function equip(id: number) {
  const g = GEAR[id];
  if (!g || count(id) <= 0) return;
  const prev = S().gear[g.slot];
  take(id, 1);
  if (prev != null) give(prev, 1);
  S().gear[g.slot] = id;
  recalc();
  save();
  sfx("equip");
  toast(ITEMS[id].n + " equipado.");
  touch();
}

export function unequip(slot: GearSlot) {
  const id = S().gear[slot];
  if (id == null) return;
  S().gear[slot] = null;
  give(id, 1);
  recalc();
  save();
  sfx("ui");
  toast(ITEMS[id].n + " guardado en la bolsa.");
  touch();
}
