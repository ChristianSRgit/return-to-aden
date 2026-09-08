import { rev, S } from "../game/state";
import { MOBS, itemIcon, ITEMS, isRareItem } from "../data";
import { MobSprite } from "../ui/Sprite";
import { levelMult } from "../game/rng";
import { fmt } from "../game/format";
import { go } from "../router";

export function Bestiary() {
  rev.value;
  const s = S();
  const mobs = Object.values(MOBS).sort((a, b) => a.lv - b.lv);
  const seen = mobs.filter((m) => (s.bestiary[m.id] || 0) > 0).length;

  return (
    <section class="pane show" id="bestiary">
      <div class="eyebrow">Bestiario</div>
      <h2 class="section-title">
        Criaturas de Aden · {seen}/{mobs.length}
      </h2>
      <p class="tiny muted" style="margin-bottom:12px">
        Stats reales de Interlude. Las presas que todavía no cazaste salen en
        silueta.
      </p>

      <div class="stack">
        {mobs.map((m) => {
          const kills = s.bestiary[m.id] || 0;
          const known = kills > 0;
          const mult = levelMult(m.lv);
          return (
            <div
              class={"card beastcard" + (known ? "" : " unknown")}
              key={m.id}
              style="padding:10px"
            >
              <div style="display:flex;gap:11px;align-items:flex-start">
                <div class="thumb" style="width:52px;height:52px;flex:0 0 auto">
                  <MobSprite mid={m.id} />
                </div>
                <div style="flex:1;min-width:0">
                  <div class="nm" style="font-family:var(--fd);font-size:14px;color:var(--parch)">
                    {known ? m.n : "? ? ?"}
                    {m.boss ? " ★" : ""}
                  </div>
                  <div class="dt" style="font-size:16px;color:var(--parch-dim);margin-top:3px">
                    Nv {m.lv} · {known ? m.race : "—"} ·{" "}
                    {known ? `${m.hp} PV` : "??? PV"}
                  </div>
                  {known && (
                    <div
                      class="dt"
                      style={`font-size:15px;margin-top:2px;color:${
                        mult > 1.001
                          ? "var(--xp)"
                          : mult < 0.999
                            ? "var(--warn)"
                            : "var(--parch-faint)"
                      }`}
                    >
                      P.ATK {m.pAtk} · P.DEF {m.pDef} · {fmt(m.exp)} EXP · botín ×
                      {mult.toFixed(2)}
                    </div>
                  )}
                </div>
                <span
                  class="tag"
                  style={known ? "color:var(--gold-soft)" : "color:var(--parch-faint)"}
                >
                  {known ? `${fmt(kills)} ×` : "—"}
                </span>
              </div>
              {known && m.drops.length > 0 && (
                <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px">
                  {m.drops.map((d) => (
                    <span
                      key={d.id}
                      class={"dropchip" + (isRareItem(d.id) ? " rare" : "")}
                      style="font-size:12px"
                    >
                      <img src={itemIcon(d.id)} alt="" />
                      {ITEMS[d.id]?.n ?? "?"} · {d.chance.toFixed(1)}%
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div class="spacer" />
      <button class="btn ghost" style="margin-top:14px" onClick={() => go("zones")}>
        ‹ Terrenos de caza
      </button>
    </section>
  );
}
