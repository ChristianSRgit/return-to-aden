import { rev } from "../game/state";
import { ZONES } from "../data";
import { MobSprite } from "../ui/Sprite";
import { levelMult } from "../game/rng";
import { zoneLv, dangerTag } from "../game/zones";
import { go, openZoneId } from "../router";
import { sfx } from "../game/audio";

function multColor(m: number) {
  return m > 1.001 ? "var(--xp)" : m < 0.999 ? "var(--warn)" : "var(--parch-dim)";
}

export function Zones() {
  rev.value;
  return (
    <section class="pane show" id="zones">
      <div class="eyebrow">Cazar</div>
      <h2 class="section-title">Terrenos de caza</h2>
      <button
        class="btn ghost"
        style="font-size:13px;margin-bottom:12px"
        onClick={() => {
          sfx("ui");
          go("bestiary");
        }}
      >
        Bestiario ›
      </button>
      <div class="stack" id="zoneList">
        {ZONES.map((z) => {
          const lv = zoneLv(z);
          const [dk, dl] = z.boss ? ["boss", "RAID"] : dangerTag(lv);
          const mult = levelMult(lv);
          return (
            <button
              key={z.id}
              class="row"
              style="width:100%"
              onClick={() => {
                sfx("ui");
                openZoneId.value = z.id;
                go("zone");
              }}
            >
              <div class="thumb">
                <MobSprite mid={z.mobs[0]} />
              </div>
              <div class="meta">
                <div class="nm">{z.name}</div>
                <div class="dt">
                  {z.region} · Nv {z.band[0]}–{z.band[1] > 90 ? "∞" : z.band[1]} ·{" "}
                  <span style={`color:${multColor(mult)}`}>
                    botín ×{mult.toFixed(2)}
                  </span>
                </div>
              </div>
              <span class={"tag " + dk}>{dl}</span>
            </button>
          );
        })}
      </div>
      <div class="spacer" />
    </section>
  );
}
