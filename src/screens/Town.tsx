import { useEffect, useLayoutEffect, useRef, useMemo } from "preact/hooks";
import { rev, S } from "../game/state";
import { MOBS, itemIcon } from "../data";
import { HeroSprite, MobSprite } from "../ui/Sprite";
import { drawSky, drawFire } from "../art/hub";
import { levelMult } from "../game/rng";
import { startBattle, startRun, nextEncounter } from "../game/battle";
import { runMult } from "../game/rng";
import { zoneLv, dangerTag, suggestedZone, riskCheck } from "../game/zones";
import {
  quickRest,
  quickRestock,
  sellJunk,
  needsRest,
  restockPlan,
  junkIds,
  junkValue,
} from "../game/townActions";
import {
  nextMile,
  mileDone,
  mileReward,
  milesReady,
} from "../game/milestones";
import { go, openZoneId } from "../router";
import { sfx } from "../game/audio";
import { fmt } from "../game/format";
import { MilesModal, ChronicleModal, BackupModal, IntroModal } from "./modals";
import { modal } from "../ui/overlays";
import { settings, markOnboarded } from "../game/settings";

const FLAVOR = [
  "El humo de las antorchas se mezcla con la niebla del río.",
  "Un enano regatea a los gritos con el mercader.",
  "Alguien afila una espada en el pórtico del gremio.",
  "Las campanas de Gludio suenan a lo lejos.",
  "La fogata chisporrotea. Afuera aúllan los lobos.",
  "Un cazador cuenta monedas y no le dan las cuentas.",
];

function multColor(m: number) {
  return m > 1.001 ? "var(--xp)" : m < 0.999 ? "var(--warn)" : "var(--parch-dim)";
}

export function Town() {
  rev.value;
  const s = S();
  const sky = useRef<HTMLCanvasElement>(null);
  const fire = useRef<HTMLCanvasElement>(null);
  const flavor = useMemo(() => FLAVOR[Math.floor(Math.random() * FLAVOR.length)], []);

  useLayoutEffect(() => {
    if (sky.current) drawSky(sky.current);
  }, []);
  useEffect(() => {
    if (!fire.current) return;
    drawFire(fire.current);
    const t = setInterval(() => fire.current && drawFire(fire.current), 125);
    return () => clearInterval(t);
  }, []);
  // one-time welcome for a brand-new hunter
  useEffect(() => {
    if (!settings.value.onboarded) {
      modal.value = IntroModal();
      markOnboarded();
    }
  }, []);

  const z = suggestedZone();
  const lv = zoneLv(z);
  const [dk, dl] = z.boss ? ["boss", "RAID"] : dangerTag(lv);
  const mult = levelMult(lv);
  const here = !!s.run && s.run.zone === z.id;
  const m = nextMile();
  const rp = restockPlan();

  const openMiles = () => {
    sfx("ui");
    modal.value = MilesModal();
  };

  return (
    <section class="pane show" id="town">
      <div
        class="huntcard"
        onClick={() => {
          sfx("ui");
          go("zones");
        }}
      >
        <div class="thumb">
          <MobSprite mid={z.mobs[0]} />
        </div>
        <div class="meta">
          <div class="eye">
            {s.run ? "EXPEDICIÓN EN CURSO" : "TERRENO DE CAZA"}
          </div>
          <div class="nm">{z.name}</div>
          <div class="dt">
            {z.region} · Nv {z.band[0]}–{z.band[1] > 90 ? "∞" : z.band[1]}
          </div>
          <div class="hcchips">
            <span class={"tag " + dk}>{dl}</span>
            <span class="tag" style={`color:${multColor(mult)}`}>
              botín ×{mult.toFixed(2)}
            </span>
            {s.run && (
              <span class="tag" style="color:var(--gold-soft)">
                racha {s.run.streak}
              </span>
            )}
          </div>
        </div>
        <span class="chg">Cambiar ›</span>
      </div>

      <div id="hubScene">
        <canvas ref={sky} id="hubSky" width={160} height={112} />
        <div id="hubGround" />
        <div id="hubActors">
          <div id="hubHero">
            <HeroSprite cls={s.cls} gear={s.gear} />
          </div>
          <div id="hubFire">
            <canvas ref={fire} width={30} height={28} />
          </div>
        </div>
        <div class="rail l">
          <RailBtn
            ic={1831}
            tx="Descansar"
            act={quickRest}
            dot={needsRest()}
            off={!needsRest()}
          />
          <RailBtn
            ic={1835}
            tx="Reponer"
            act={quickRestock}
            dot={(rp.potFalta > 4 || rp.shotFalta > 20) && s.adena >= 90}
            off={!rp.potFalta && !rp.shotFalta}
          />
          <RailBtn
            ic={1873}
            tx="Vender"
            act={sellJunk}
            dot={junkValue() >= 500}
            off={!junkIds().length}
          />
        </div>
        <div class="rail r">
          <RailBtn ic={1875} tx="Hitos" act={openMiles} dot={milesReady() > 0} />
          <RailBtn
            ic={2255}
            tx="Crónica"
            act={() => { sfx("ui"); modal.value = ChronicleModal(); }}
          />
          <RailBtn
            ic={6667}
            tx="Respaldo"
            act={() => { sfx("ui"); modal.value = BackupModal(); }}
          />
        </div>
      </div>

      <p class="tiny muted center" style="margin:9px 0 2px">
        {flavor}
      </p>

      <div id="hubMile" class={m && mileDone(m) ? "ready" : ""} onClick={openMiles}>
        {m ? (
          <>
            <div class="top">
              <span>
                {mileDone(m) ? "HITO LISTO" : "PRÓXIMO HITO"} · <b>{m.t}</b>
              </span>
              <b>
                {mileDone(m)
                  ? "cobrar"
                  : `${fmt(Math.min(m.cur(), m.goal))}/${fmt(m.goal)}`}
              </b>
            </div>
            <div class="bar xp slim">
              <i style={`right:${100 - Math.min(100, (100 * m.cur()) / m.goal)}%`} />
            </div>
            <div class="tiny muted" style="margin-top:5px">
              {m.d} → {mileReward(m)}
            </div>
          </>
        ) : (
          <>
            <div class="top">
              <span>TODOS LOS HITOS COMPLETOS</span>
              <b>✦</b>
            </div>
            <div class="bar xp slim">
              <i style="right:0%" />
            </div>
          </>
        )}
      </div>

      <button
        class="btn gold"
        id="hubCta"
        onClick={() => {
          sfx("ui");
          if (z.boss) {
            riskCheck(MOBS[z.mobs[0]].lv, () => {
              startBattle(z.mobs[0], z);
              go("battle");
            });
            return;
          }
          const worst = Math.max(...z.mobs.map((id) => MOBS[id].lv));
          riskCheck(worst, () => {
            if (here) nextEncounter();
            else startRun(z);
            go("battle");
          });
        }}
      >
        {z.boss ? (
          <>
            Enfrentar el raid
            <small>
              {MOBS[z.mobs[0]].n} · Nv {MOBS[z.mobs[0]].lv}
            </small>
          </>
        ) : here ? (
          <>
            Continuar expedición
            <small>
              racha {s.run!.streak} · botín ×{runMult().toFixed(2)}
            </small>
          </>
        ) : (
          <>
            Iniciar expedición<small>{z.name}</small>
          </>
        )}
      </button>
      {/* keep openZoneId import alive for future deep-links */}
      <span hidden>{openZoneId.value}</span>
    </section>
  );
}

function RailBtn({
  ic,
  tx,
  act,
  dot,
  off,
}: {
  ic: number;
  tx: string;
  act: () => void;
  dot?: boolean;
  off?: boolean;
}) {
  return (
    <button
      class={"rbtn" + (off ? " off" : "")}
      onClick={() => {
        sfx("ui");
        act();
      }}
    >
      {dot && <span class="dot">!</span>}
      <img class="ic" src={itemIcon(ic)} alt="" style="width:22px;height:22px" />
      <span class="tx">{tx}</span>
    </button>
  );
}
