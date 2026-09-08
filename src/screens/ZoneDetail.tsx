import { useEffect } from "preact/hooks";
import { rev, S, save } from "../game/state";
import { MOBS, ZONES } from "../data";
import { MobSprite } from "../ui/Sprite";
import { levelMult } from "../game/rng";
import { zoneLv, dangerTag, riskCheck, RUN_STEP_PCT, RUN_CAP_PCT, ELITE_FROM } from "../game/zones";
import { startBattle, startRun, nextEncounter } from "../game/battle";
import { go, openZoneId } from "../router";
import { toast } from "../ui/overlays";

function multColor(m: number) {
  return m > 1.001 ? "var(--xp)" : m < 0.999 ? "var(--warn)" : "var(--parch-dim)";
}

export function ZoneDetail() {
  rev.value;
  const s = S();
  const z = ZONES.find((x) => x.id === openZoneId.value);
  useEffect(() => {
    if (!z) {
      go("zones");
      return;
    }
    if (s.lastZone !== z.id) {
      s.lastZone = z.id;
      save();
    }
  }, [z?.id]);
  if (!z) return null;
  const here = !!s.run && s.run.zone === z.id;
  const worst = Math.max(...z.mobs.map((id) => MOBS[id].lv));

  return (
    <section class="pane show" id="zone">
      <div class="eyebrow">{z.region}</div>
      <h2 class="section-title">{z.name}</h2>
      <p class="muted" style="margin-bottom:12px;font-size:19px">
        {z.desc}
      </p>

      {z.boss ? (
        <p class="tiny muted" style="margin:8px 0 4px;line-height:1.7">
          Un raid se pelea una vez y se cuenta después. Sin expediciones acá.
          <br />
          Paga <b>×{levelMult(zoneLv(z)).toFixed(2)}</b> por tu diferencia de nivel.
        </p>
      ) : (
        <>
          <button
            class="btn gold"
            onClick={() => {
              if (s.run && !here) {
                toast("Ya tenés una expedición abierta en otro terreno.");
                return;
              }
              riskCheck(worst, () => {
                if (here) {
                  nextEncounter();
                } else {
                  startRun(z);
                }
                go("battle");
              });
            }}
          >
            {here ? `Continuar expedición · racha ${s.run!.streak}` : "Iniciar expedición"}
          </button>
          <p class="tiny muted" style="margin:8px 0 4px;line-height:1.7">
            Combates encadenados en este terreno. Cada presa suma{" "}
            <b style="color:var(--xp)">+{RUN_STEP_PCT}%</b> a adena, EXP y SP (tope
            +{RUN_CAP_PCT}%). No se cura nada entre peleas y, a partir de la racha{" "}
            {ELITE_FROM}, pueden aparecer élites. Si caés, perdés la racha.
            <br />
            Este terreno paga <b>×{levelMult(zoneLv(z)).toFixed(2)}</b> por tu
            diferencia de nivel.
          </p>
        </>
      )}

      <div class="tiny" style="color:var(--gold-deep);margin:16px 0 7px">
        {z.boss ? "EL RAID" : "CAZA SUELTA · UN COMBATE"}
      </div>
      <div class="stack" id="zoneMobs">
        {z.mobs.map((mid) => {
          const m = MOBS[mid];
          const mult = levelMult(m.lv);
          return (
            <button
              key={mid}
              class="row"
              style="width:100%"
              onClick={() =>
                riskCheck(m.lv, () => {
                  save();
                  startBattle(mid, z);
                  go("battle");
                })
              }
            >
              <div class="thumb">
                <MobSprite mid={mid} />
              </div>
              <div class="meta">
                <div class="nm">
                  {m.n}
                  {m.boss ? " ★" : ""}
                </div>
                <div class="dt">
                  Nv {m.lv} · {m.race} · {m.hp} PV{m.boss ? " (raid ×1.6)" : ""}
                </div>
                <div class="dt" style={`color:${multColor(mult)}`}>
                  botín ×{mult.toFixed(2)} · {dangerTag(m.lv)[1]}
                </div>
              </div>
              <span class={"tag " + (m.boss ? "boss" : dangerTag(m.lv)[0])}>
                Cazar ›
              </span>
            </button>
          );
        })}
      </div>
      <div class="spacer" />
      <button
        class="btn ghost"
        style="margin-top:14px"
        onClick={() => go("zones")}
      >
        ‹ Otros terrenos
      </button>
    </section>
  );
}
