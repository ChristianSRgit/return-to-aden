import { rev, S, save, take, count } from "../game/state";
import { ITEMS, GEAR, SLOTS, SLOT_LABEL, itemIcon, isRareItem } from "../data";
import { gearBonus } from "../game/state";
import { HeroSprite } from "../ui/Sprite";
import { gearLine, gearCompare, equip, unequip } from "../game/equipment";
import { potionHeal } from "../game/battle";
import { fmt } from "../game/format";
import { sfx } from "../game/audio";
import { toast, modal, closeModal } from "../ui/overlays";

const TYPE_ORDER = [
  "arma",
  "armadura",
  "escudo",
  "joya",
  "poción",
  "munición",
  "material",
  "pieza",
  "receta",
  "pergamino",
  "llave",
  "moneda",
];

function itemModal(id: number) {
  const it = ITEMS[id];
  const heal = potionHeal(id);
  const g = GEAR[id];
  const val = Math.max(1, Math.floor((it.price || 1) / 2));
  const actions: {
    label: string;
    kind?: "gold" | "ghost" | "danger";
    onClick: () => void;
  }[] = [];
  if (heal)
    actions.push({
      label: "Usar",
      kind: "gold",
      onClick: () => {
        const s = S();
        if (s.hp >= s.hpMax) {
          toast("Ya tenés el PV al máximo.");
          return;
        }
        s.hp = Math.min(s.hpMax, s.hp + heal);
        take(id, 1);
        save();
        closeModal();
        sfx("heal");
        toast("Usás " + it.n + ". +" + heal + " PV.");
      },
    });
  if (g)
    actions.push({
      label: "Equipar",
      kind: "gold",
      onClick: () => {
        closeModal();
        equip(id);
      },
    });
  actions.push({
    label: `Vender · ${fmt(val)}`,
    onClick: () => {
      take(id, 1);
      S().adena += val;
      save();
      closeModal();
      sfx("coin");
      toast("Vendés " + it.n + " por " + fmt(val) + " adena.");
    },
  });
  actions.push({ label: "Cerrar", kind: "ghost", onClick: closeModal });

  modal.value = {
    title: it.n,
    body: (
      <>
        <img src={itemIcon(id)} alt="" />
        <b>{it.n}</b>
        <br />
        {it.t}
        {it.g !== "none" ? ` · grado ${it.g.toUpperCase()}` : ""}
        <br />
        Cantidad: {count(id)}
        <br />
        Valor de venta: {val} adena
        {heal ? (
          <>
            <br />
            <span style="color:var(--xp)">Cura {heal} PV al usarla</span>
          </>
        ) : null}
        {g ? (
          <>
            <br />
            <span style="color:var(--gold-soft)">
              {SLOT_LABEL[g.slot]} · {gearLine(id)}
            </span>
            <br />
            <span class="tiny">Contra lo equipado: {gearCompare(id)}</span>
          </>
        ) : null}
      </>
    ),
    actions,
  };
}

export function Inventory() {
  rev.value;
  const s = S();
  const ids = Object.keys(s.inv)
    .map(Number)
    .filter((id) => count(id) > 0);
  const b = gearBonus();
  const bonusParts = (
    [
      ["pAtk", "P.ATK"],
      ["pDef", "P.DEF"],
      ["luck", "SUERTE"],
      ["hp", "PV"],
      ["mp", "PM"],
    ] as const
  ).filter(([k]) => b[k]);

  const byType: Record<string, number[]> = {};
  ids.forEach((id) => {
    const t = ITEMS[id]?.t || "material";
    (byType[t] = byType[t] || []).push(id);
  });
  const types = Object.keys(byType).sort((a, z) => {
    const ia = TYPE_ORDER.indexOf(a),
      ib = TYPE_ORDER.indexOf(z);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  return (
    <section class="pane show" id="inv">
      <div class="eyebrow">Inventario</div>
      <h2 class="section-title">Bolsa · {ids.length} objetos</h2>

      <div class="tiny" style="color:var(--gold-deep);margin-bottom:7px">
        EQUIPO
      </div>
      <div id="equipStage">
        <HeroSprite cls={s.cls} gear={s.gear} />
        <div class="st">
          {bonusParts.length
            ? bonusParts.map(([k, l], i) => (
                <span key={k}>
                  {i ? " · " : "DEL EQUIPO: "}
                  <b>+{b[k]}</b> {l}
                </span>
              ))
            : "SIN EQUIPO"}
        </div>
      </div>
      <div id="equipPanel">
        {SLOTS.map((sl) => {
          const id = s.gear[sl.k];
          const it = id != null ? ITEMS[id] : null;
          return (
            <div class={"eqrow" + (id != null ? " on" : "")} key={sl.k}>
              <div class="thumb">
                {it && <img src={itemIcon(it.id)} alt="" />}
              </div>
              <div class="meta">
                <div class="sl">{sl.label}</div>
                <div class={"nm" + (id != null ? "" : " none")}>
                  {it ? it.n : sl.empty}
                </div>
                {id != null && <div class="bo">{gearLine(id)}</div>}
              </div>
              {id != null && (
                <button class="btn ghost" onClick={() => unequip(sl.k)}>
                  Quitar
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div class="tiny" style="color:var(--gold-deep);margin:16px 0 7px">
        BOLSA
      </div>
      {ids.length === 0 ? (
        <p class="tiny muted center" style="margin-top:20px">
          Tu bolsa está vacía.
          <br />
          Los monstruos de Aden guardan sus tesoros.
        </p>
      ) : (
        types.map((t) => {
          const list = byType[t].sort((a, z) => (ITEMS[a].n > ITEMS[z].n ? 1 : -1));
          return (
            <div class="invgroup" key={t}>
              <h4>
                {t} · {list.length}
              </h4>
              <div class="slotgrid">
                {list.map((id) => (
                  <button
                    key={id}
                    class={"slot" + (isRareItem(id) ? " rare" : "")}
                    onClick={() => itemModal(id)}
                  >
                    <img src={itemIcon(id)} alt={ITEMS[id].n} />
                    <span class="qty">{fmt(count(id))}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })
      )}
      <div class="spacer" />
    </section>
  );
}
