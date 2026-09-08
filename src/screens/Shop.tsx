import { rev, S, save, give, take, count } from "../game/state";
import {
  ITEMS,
  GEAR,
  SHOP,
  SHOP_GEAR,
  SLOT_LABEL,
  POTION_HEAL,
  itemIcon,
} from "../data";
import { potionHeal, shotId } from "../game/battle";
import { gearLine, gearCompare, equip } from "../game/equipment";
import { fmt } from "../game/format";
import { sfx } from "../game/audio";
import { toast, confirmModal } from "../ui/overlays";

function purchase(id: number, price: number, qty: number, autoEquip = false) {
  const s = S();
  const total = price * qty;
  if (s.adena < total) {
    toast("No te alcanza la adena.");
    return;
  }
  s.adena -= total;
  give(id, qty);
  save();
  sfx("coin");
  toast(qty > 1 ? `Comprás ${qty} × ${ITEMS[id].n}.` : `Comprás ${ITEMS[id].n}.`);
  if (autoEquip && GEAR[id]) equip(id);
}

function shopDesc(id: number): string {
  if (POTION_HEAL[id]) return "cura " + potionHeal(id) + " PV";
  if (id === 1835 || id === 2509) return "daño ×2 · gasta 1 por golpe";
  return "";
}

export function Shop() {
  rev.value;
  const s = S();
  const junk = Object.keys(s.inv)
    .map(Number)
    .filter((id) => id !== 57 && !POTION_HEAL[id] && id !== shotId());

  return (
    <section class="pane show" id="shop">
      <div class="eyebrow">Tienda del Gremio</div>
      <h2 class="section-title">Mercader</h2>
      <div
        class="panel"
        style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center"
      >
        <span class="tiny muted">Tu bolsa</span>
        <span class="coin">
          <img src={itemIcon(57)} alt="" />
          {fmt(s.adena)}
        </span>
      </div>

      <div class="tiny" style="color:var(--gold-deep);margin-bottom:6px">
        CONSUMIBLES
      </div>
      <div class="stack">
        {SHOP.filter((x) => !x.cls || x.cls.includes(s.cls)).map((x) => {
          const it = ITEMS[x.id];
          return (
            <div class="row" key={x.id}>
              <div class="thumb">
                <img src={itemIcon(x.id)} style="width:70%" alt="" />
              </div>
              <div class="meta">
                <div class="nm">{it.n}</div>
                <div class="dt">
                  {shopDesc(x.id)} · {fmt(x.buy)} adena · tenés {fmt(count(x.id))}
                </div>
              </div>
              <div class="buybtns">
                <button
                  class="btn gold"
                  disabled={s.adena < x.buy}
                  onClick={() => purchase(x.id, x.buy, 1)}
                >
                  x1
                </button>
                <button
                  class="btn"
                  disabled={s.adena < x.buy * 10}
                  onClick={() => purchase(x.id, x.buy, 10)}
                >
                  x10
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div class="tiny" style="color:var(--gold-deep);margin:16px 0 6px">
        ARMERÍA
      </div>
      <div class="stack">
        {SHOP_GEAR.map((x) => {
          const it = ITEMS[x.id];
          const g = GEAR[x.id];
          const locked = s.lv < x.req;
          const owned = count(x.id) > 0;
          const worn = s.gear[g.slot] === x.id;
          return (
            <div class={"row" + (locked ? " locked" : "")} key={x.id}>
              <div class="thumb">
                <img src={itemIcon(x.id)} style="width:70%" alt="" />
              </div>
              <div class="meta">
                <div class="nm">{it.n}</div>
                <div class="dt">
                  {SLOT_LABEL[g.slot]} · {gearLine(x.id)}
                </div>
                <div class="dt" style="color:var(--gold-soft)">
                  {locked ? "" : gearCompare(x.id)}
                </div>
              </div>
              {locked ? (
                <span class="tag">Nv {x.req}</span>
              ) : worn ? (
                <span class="tag fair">Puesto</span>
              ) : owned ? (
                <button
                  class="btn"
                  style="flex:0 0 auto;font-size:13px;padding:9px 8px"
                  onClick={() => equip(x.id)}
                >
                  Equipar
                </button>
              ) : (
                <button
                  class="btn gold"
                  style="flex:0 0 auto;font-size:13px;padding:9px 8px"
                  disabled={s.adena < x.buy}
                  onClick={() => purchase(x.id, x.buy, 1, true)}
                >
                  {fmt(x.buy)}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div class="tiny" style="color:var(--gold-deep);margin:16px 0 6px">
        VENDER BOTÍN (½ precio)
      </div>
      <div class="slotgrid">
        {junk.length === 0 && (
          <p class="tiny muted" style="grid-column:1/-1">
            Nada para vender todavía.
          </p>
        )}
        {junk.map((id) => {
          const it = ITEMS[id];
          const val = Math.max(1, Math.floor((it.price || 1) / 2));
          return (
            <button
              key={id}
              class="slot"
              onClick={() =>
                confirmModal(
                  "Vender " + it.n,
                  <>
                    <img src={itemIcon(id)} alt="" />
                    Vender 1 por <b>{val}</b> adena. Tenés {count(id)}.
                  </>,
                  () => {
                    take(id, 1);
                    S().adena += val;
                    save();
                  },
                )
              }
            >
              <img src={itemIcon(id)} alt={it.n} />
              <span class="qty">{count(id)}</span>
            </button>
          );
        })}
      </div>
      <div class="spacer" />
    </section>
  );
}
