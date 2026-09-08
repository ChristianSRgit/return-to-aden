import { ITEMS, GEAR, SHOP, JUNK_TYPES } from "../data";
import { S, save, give, count, touch } from "./state";
import { sfx } from "./audio";
import { shotId, shotName } from "./battle";
import { toast, confirmModal } from "../ui/overlays";
import { fmt } from "./format";

export function junkIds(): number[] {
  const s = S();
  return Object.keys(s.inv)
    .map(Number)
    .filter((id) => ITEMS[id] && JUNK_TYPES.includes(ITEMS[id].t) && count(id) > 0);
}
export function junkValue(): number {
  return junkIds().reduce(
    (a, id) => a + Math.max(1, Math.floor((ITEMS[id].price || 1) / 2)) * count(id),
    0,
  );
}
export function needsRest(): boolean {
  const s = S();
  return s.hp < s.hpMax || s.mp < s.mpMax;
}

const RESTOCK_POT = 15,
  RESTOCK_SHOT = 60;
export function restockPlan() {
  const potFalta = Math.max(0, RESTOCK_POT - count(1060));
  const shotFalta = Math.max(0, RESTOCK_SHOT - count(shotId()));
  const shotPrecio = (SHOP.find((x) => x.id === shotId()) || { buy: 14 }).buy;
  return {
    potFalta,
    shotFalta,
    shotPrecio,
    costo: potFalta * 90 + shotFalta * shotPrecio,
  };
}
export function quickRest() {
  const s = S();
  if (!needsRest()) {
    toast("Ya estás pleno.");
    return;
  }
  s.hp = s.hpMax;
  s.mp = s.mpMax;
  save();
  sfx("heal");
  toast("Descansás en la posada. PV y PM al máximo.");
  touch();
}
export function quickRestock() {
  const s = S();
  const pl = restockPlan();
  if (!pl.potFalta && !pl.shotFalta) {
    toast("Ya tenés el morral lleno.");
    return;
  }
  if (s.adena < 90 && s.adena < pl.shotPrecio) {
    toast("No te alcanza la adena.");
    return;
  }
  let pot = 0,
    sh = 0,
    gasto = 0;
  while (sh < pl.shotFalta && s.adena - gasto >= pl.shotPrecio) {
    sh++;
    gasto += pl.shotPrecio;
  }
  while (pot < pl.potFalta && s.adena - gasto >= 90) {
    pot++;
    gasto += 90;
  }
  if (!pot && !sh) {
    toast("No te alcanza la adena.");
    return;
  }
  s.adena -= gasto;
  if (pot) give(1060, pot);
  if (sh) give(shotId(), sh);
  save();
  sfx("coin");
  toast(
    `Reponés ${[pot ? pot + " pociones" : null, sh ? sh + " " + shotName() : null]
      .filter(Boolean)
      .join(" y ")} por ${fmt(gasto)} adena.`,
  );
  touch();
}
export function sellJunk() {
  const ids = junkIds(),
    val = junkValue();
  if (!ids.length) {
    toast("No tenés materiales para vender.");
    return;
  }
  confirmModal(
    "Vender materiales",
    <>
      Vas a vender <b>{ids.reduce((a, id) => a + count(id), 0)}</b> objetos de{" "}
      {ids.length} tipos por{" "}
      <b style="color:var(--gold-soft)">{fmt(val)}</b> adena.
      <br />
      <br />
      <span class="tiny">
        No toca armas, armaduras, joyas, pociones ni munición.
      </span>
    </>,
    () => {
      const s = S();
      ids.forEach((id) => delete s.inv[id]);
      s.adena += val;
      save();
      sfx("coin");
      toast(`Vendés el botín por ${fmt(val)} adena.`);
      touch();
    },
  );
}

export const hasGearUpgrade = () => {
  const s = S();
  return Object.keys(s.inv)
    .map(Number)
    .some((i) => {
      const g = GEAR[i];
      if (!g || count(i) <= 0) return false;
      const curId = s.gear[g.slot];
      const cur = curId != null ? GEAR[curId] : undefined;
      const val = (o?: Record<string, number>) =>
        Object.values(o || {}).reduce((a, v) => a + v, 0);
      return val(g.b) > val(cur?.b);
    });
};
