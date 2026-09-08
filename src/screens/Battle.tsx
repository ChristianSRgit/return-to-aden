import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { rev, S, count } from "../game/state";
import { SKILLS, ITEMS, itemIcon, type SpriteKey } from "../data";
import { spriteFor, drawBackdrop } from "../art/pixels";
import {
  battle,
  battleLog,
  speed,
  turn,
  onFx,
  type FxEvent,
  type VictoryData,
  type DefeatData,
  type LevelGain,
  shotId,
  shotName,
  fleeOdds,
  potionHeal,
  toggleAuto,
  toggleShot,
  cycleSpeed,
  queueAction,
  getB,
  champIn,
  pushOn,
  retreatToTown,
  afterDefeat,
  battleBackdrop,
} from "../game/battle";
import { levelMult } from "../game/rng";
import { xpToNext } from "../game/progression";
import { ELITE_MULT } from "../data";
import { go, openZoneId } from "../router";
import { fmt } from "../game/format";
import { modal, closeModal, toast } from "../ui/overlays";
import { HeroSprite } from "../ui/Sprite";
import * as particles from "../game/particles";

const HAS_KB =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(hover:hover)").matches;

export function Battle() {
  rev.value;
  const b = battle.value;
  const s = S();
  const arena = useRef<HTMLDivElement>(null);
  const heroWrap = useRef<HTMLDivElement>(null);
  const mobWrap = useRef<HTMLDivElement>(null);
  const bg = useRef<HTMLCanvasElement>(null);
  const fxCanvas = useRef<HTMLCanvasElement>(null);
  const [result, setResult] = useState<
    | { kind: "victory"; data: VictoryData }
    | { kind: "defeat"; data: DefeatData }
    | null
  >(null);
  const [levelUp, setLevelUp] = useState<LevelGain[] | null>(null);
  const [banner, setBanner] = useState<{ text: string; sub?: string } | null>(null);

  // paint the backdrop once per fight
  useLayoutEffect(() => {
    if (bg.current)
      drawBackdrop(bg.current.getContext("2d")!, 100, 160, battleBackdrop());
  }, [b?.mid]);

  // FX event handling
  useEffect(() => {
    particles.attach(fxCanvas.current);
    const spawnPopup = (
      host: HTMLElement | null,
      text: string,
      cls: string,
    ) => {
      if (!host) return;
      const p = document.createElement("div");
      p.className = "popup " + cls;
      p.textContent = text;
      p.style.left = 38 + Math.random() * 26 + "%";
      host.appendChild(p);
      setTimeout(() => p.remove(), 1000);
    };
    // normalised centre of a fighter wrap inside the fx canvas
    const spotOf = (who: "hero" | "mob"): [number, number] => {
      const w = who === "hero" ? heroWrap.current : mobWrap.current;
      const c = fxCanvas.current;
      if (!w || !c) return [0.5, who === "hero" ? 0.72 : 0.3];
      const wr = w.getBoundingClientRect();
      const cr = c.getBoundingClientRect();
      return [
        (wr.left + wr.width / 2 - cr.left) / cr.width,
        (wr.top + wr.height * 0.45 - cr.top) / cr.height,
      ];
    };
    const off = onFx((e: FxEvent) => {
      switch (e.t) {
        case "popup":
          spawnPopup(
            e.where === "hero" ? heroWrap.current : mobWrap.current,
            e.text,
            e.cls,
          );
          break;
        case "hit": {
          const w = e.who === "hero" ? heroWrap.current : mobWrap.current;
          if (!w) break;
          w.classList.remove("idle");
          w.classList.add("hit");
          setTimeout(() => {
            w.classList.remove("hit");
            if (!getB()?.over) w.classList.add("idle");
          }, 330);
          break;
        }
        case "flash": {
          const f = document.getElementById("flash");
          if (f) {
            f.classList.remove("go", "strong");
            void f.offsetWidth;
            f.classList.add("go");
            if (e.strong) f.classList.add("strong");
          }
          break;
        }
        case "shake": {
          const amp = Math.max(2, Math.min(11, 3 * (e.amp ?? 1)));
          document
            .getElementById("screen")
            ?.animate(
              [
                { transform: "translate(0,0)" },
                { transform: `translate(${-amp}px, ${amp * 0.4}px)` },
                { transform: `translate(${amp * 0.8}px, ${-amp * 0.3}px)` },
                { transform: `translate(${-amp * 0.4}px, 0)` },
                { transform: "translate(0,0)" },
              ],
              { duration: 180 + amp * 10, easing: "ease-out" },
            );
          break;
        }
        case "sparks": {
          const [x, y] = spotOf(e.where);
          const magic = e.kind === "magic";
          const cols = magic
            ? ["#8ff5ec", "#34d1c4", "#ffffff"]
            : e.where === "hero"
              ? ["#ffffff", "#ff7a72", "#e05650"]
              : ["#ffffff", "#f4c66a", "#f2b134"];
          particles.burst(x, y, {
            count: (e.crit ? 22 : 10) + Math.round(e.power * 12),
            speed: (magic ? 0.24 : 0.34) + e.power * 0.2 + (e.crit ? 0.14 : 0),
            spread: magic ? Math.PI * 2 : Math.PI * 1.5,
            angle: e.where === "hero" ? -Math.PI / 2 : -Math.PI / 2.4,
            colors: cols,
            size: (magic ? 2.6 : 3) + (e.crit ? 1.4 : 0),
            life: e.crit ? 560 : magic ? 520 : 420,
            gravity: magic ? 0.0002 : 0.0013,
            shape: magic ? "mote" : "shard",
            glow: magic ? 12 : 7,
          });
          if (e.crit) particles.ring(x, y, magic ? "#34d1c4" : "#ff5d4d");
          break;
        }
        case "critpulse": {
          const el = document.getElementById("critpulse");
          if (el) {
            el.className = "";
            void el.offsetWidth;
            el.className = "go " + (e.who === "hero" ? "hurt" : "hit");
          }
          break;
        }
        case "pose": {
          const h = heroWrap.current;
          if (!h) break;
          h.classList.remove("idle", "lunge", "cast");
          void h.offsetWidth;
          if (e.pose !== "idle") h.classList.add(e.pose);
          setTimeout(() => {
            h.classList.remove("lunge", "cast");
            if (!getB()?.over) h.classList.add("idle");
          }, 500);
          break;
        }
        case "spawn": {
          const host =
            e.host === "hero"
              ? heroWrap.current
              : e.host === "foe"
                ? mobWrap.current
                : arena.current;
          if (!host) break;
          const d = document.createElement("div");
          d.className = "fx " + e.cls;
          if (e.html) d.innerHTML = e.html;
          host.appendChild(d);
          setTimeout(() => d.remove(), e.life);
          break;
        }
        case "streak":
          setBanner({ text: e.text, sub: e.sub });
          setTimeout(() => setBanner(null), 1300);
          break;
        case "result":
          if (e.kind === "victory")
            setResult({ kind: "victory", data: e.data as VictoryData });
          else setResult({ kind: "defeat", data: e.data as DefeatData });
          break;
        case "levelup":
          setLevelUp(e.gains);
          break;
        case "closeResult":
          setResult(null);
          setLevelUp(null);
          break;
      }
    });
    return () => {
      off();
      particles.attach(null);
    };
  }, []);

  if (!b) {
    // battle ended and cleared — bounce home
    useEffect(() => {
      go("town");
    }, []);
    return null;
  }

  const m = b.m as typeof b.m & { elite?: boolean; champ?: boolean };
  const lm = levelMult(m.lv);
  const shotN = count(shotId());
  const potN = count(1060) + count(1061);
  const cheapestSkill = Math.min(
    ...s.loadout.map((k) => SKILLS[k]?.mp ?? Infinity),
  );

  const cmd = (fn: () => void, off: boolean, why: string) => () => {
    if (b.over) return;
    if (off) {
      toast(why);
      return;
    }
    if (b.busy) {
      queueAction(fn);
      return;
    }
    fn();
  };

  const openSkillPicker = () => {
    if (s.loadout.length === 1) {
      turn("skill", s.loadout[0]);
      return;
    }
    modal.value = {
      title: "Habilidad",
      body: (
        <div class="stack">
          {s.loadout.map((k) => {
            const sk = SKILLS[k];
            const falta = sk.mp - s.mp;
            return (
              <button
                key={k}
                class={"btn skpick" + (falta > 0 ? " off" : "")}
                onClick={() => {
                  if (falta > 0) {
                    toast(`${sk.name} cuesta ${sk.mp} PM y tenés ${s.mp}.`);
                    return;
                  }
                  closeModal();
                  turn("skill", k);
                }}
              >
                <b>{sk.name}</b>
                <span class="sub">{sk.txt}</span>
                <span class="cost">
                  {falta > 0 ? `faltan ${falta} PM` : `${sk.mp} PM`}
                </span>
              </button>
            );
          })}
        </div>
      ),
      actions: [{ label: "Cancelar", kind: "ghost", onClick: closeModal }],
    };
  };
  const openItemPicker = () => {
    const opts = [1060, 1061].filter((id) => count(id) > 0);
    modal.value = {
      title: "Usar poción",
      body: (
        <div class="stack">
          {opts.map((id) => (
            <button
              key={id}
              class="btn skpick"
              onClick={() => {
                closeModal();
                turn("potion", id);
              }}
            >
              <b>{ITEMS[id].n}</b>
              <span class="sub">recupera {potionHeal(id)} PV</span>
              <span class="cost">te quedan {count(id)}</span>
            </button>
          ))}
        </div>
      ),
      actions: [{ label: "Cancelar", kind: "ghost", onClick: closeModal }],
    };
  };

  const buffDmg = b.buff?.dmg ? ` +${Math.round(b.buff.dmg * 100)}%` : "";
  const commands = [
    { t: "Atacar", k: "físico" + buffDmg, fn: () => turn("attack"), off: false, why: "" },
    {
      t: "Habilidad",
      k:
        s.loadout.length === 1
          ? SKILLS[s.loadout[0]].mp + " PM"
          : s.loadout.length + " skills · " + cheapestSkill + " PM",
      fn: openSkillPicker,
      off: s.mp < cheapestSkill,
      why: `Te faltan ${cheapestSkill - s.mp} PM para la habilidad más barata.`,
    },
    {
      t: "Ítem",
      k: potN + " pociones",
      fn: openItemPicker,
      off: potN === 0,
      why: "No te quedan pociones.",
    },
    {
      t: shotName(),
      k: shotN + " · " + (b.armed ? "ACTIVO" : "off"),
      fn: toggleShot,
      off: shotN === 0 && !b.armed,
      armed: b.armed,
      why: `No te queda ${shotName()}. Reponé en la tienda.`,
    },
    { t: "Guardia", k: "−55% daño", fn: () => turn("guard"), off: false, why: "" },
    { t: "Huir", k: fleeOdds() + "%", fn: () => turn("flee"), off: false, why: "" },
  ];

  return (
    <section class="pane show" id="battle">
      <div id="bhud">
        <span class="chips">
          <span class="chip">
            <b>Nv {s.lv}</b>
          </span>
          {m.elite && (
            <span class="chip elite">ÉLITE ×{ELITE_MULT.loot}</span>
          )}
          {m.boss && <span class="chip raid">RAID</span>}
          {Math.abs(lm - 1) > 0.001 && (
            <span class={"chip " + (lm > 1 ? "hot" : "")}>
              Botín <b>×{lm.toFixed(2)}</b>
            </span>
          )}
          {m.champ ? (
            <span class="chip champ">★ CAMPEÓN</span>
          ) : (
            s.run &&
            champIn() > 0 &&
            champIn() <= 3 && (
              <span class="chip champ">
                Campeón en <b>{champIn()}</b>
              </span>
            )
          )}
        </span>
        <span class="ctrl">
          <button class={speed.value > 1 ? "on" : ""} onClick={cycleSpeed}>
            ×{speed.value}
          </button>
          <button class={b.auto ? "on" : ""} onClick={toggleAuto}>
            AUTO
          </button>
        </span>
      </div>

      <div class="arena" ref={arena}>
        <canvas ref={bg} id="sceneBg" width={100} height={160} />
        <canvas ref={fxCanvas} id="fxParticles" />
        <div class="skypad" />

        <div class="side foe">
          <div
            id="mobIntent"
            class={
              b.intent?.heavy && !b.over && !b.stunned
                ? ""
                : b.mdeb && !b.over
                  ? "debuff"
                  : "off"
            }
          >
            {b.intent?.heavy && !b.over && !b.stunned
              ? "⚠ GOLPE BRUTAL — cubrite"
              : b.mdeb && !b.over
                ? `DEFENSA ABIERTA −${Math.round(b.mdeb.def * 100)}% · ${b.mdeb.turns}t`
                : " "}
          </div>
          <div class="mobplate">
            {m.n}
            {m.boss ? "  ★ RAID" : ""}
            {m.elite ? "  ✦" : ""} Nv {m.lv}
          </div>
          <div class="hpline">
            <div class="bar hp">
              <i class="ghost" style={`right:${100 - (100 * b.mHp) / b.mHpMax}%`} />
              <i style={`right:${100 - (100 * b.mHp) / b.mHpMax}%`} />
            </div>
            <b>
              {fmt(b.mHp)}/{fmt(b.mHpMax)}
            </b>
          </div>
          <div
            ref={mobWrap}
            class={
              "fighter mob idle" +
              (m.boss ? " boss" : "") +
              (m.elite ? " elite" : "") +
              (m.champ ? " champ" : "") +
              (b.intent?.heavy && !b.over ? " winding" : "")
            }
          >
            <span class="shadow" />
            {(m.boss || m.elite || m.champ) && <span class="aura" />}
            <MobArt art={m.art as SpriteKey} variant={(m as { variant?: boolean }).variant} />
          </div>
        </div>

        <div class="side you">
          <div id="heroBuff" class={b.buff && !b.over ? "" : "off"}>
            {b.buff && !b.over
              ? `${buffTagShort(b.buff)} · ${b.buff.turns}t`
              : " "}
          </div>
          <div ref={heroWrap} class="fighter hero idle">
            <span class="shadow" />
            <HeroSprite cls={s.cls} gear={s.gear} />
          </div>
          <div class="hpline">
            <span class="lbl">PV</span>
            <div class="bar hp">
              <i class="ghost" style={`right:${100 - (100 * s.hp) / s.hpMax}%`} />
              <i style={`right:${100 - (100 * s.hp) / s.hpMax}%`} />
            </div>
            <b>
              {fmt(s.hp)}/{fmt(s.hpMax)}
            </b>
          </div>
          <div class="hpline">
            <span class="lbl">PM</span>
            <div class="bar mp slim">
              <i style={`right:${100 - (100 * s.mp) / Math.max(1, s.mpMax)}%`} />
            </div>
            <b>
              {fmt(s.mp)}/{fmt(s.mpMax)}
            </b>
          </div>
        </div>

        {banner && (
          <div id="streakBanner" class="go">
            {banner.text}
            {banner.sub && <small>{banner.sub}</small>}
          </div>
        )}
      </div>

      <div class="textbox" id="log" aria-live="polite">
        {battleLog.value.map((l, i) => (
          <p key={i} class={l.cls}>
            {l.txt}
          </p>
        ))}
      </div>

      <div class="cmdgrid" id="cmdGrid">
        {commands.map((c, i) => (
          <button
            key={c.t}
            class={
              "btn" +
              ((c as { armed?: boolean }).armed ? " armed" : "") +
              (c.off ? " off" : "") +
              (b.busy ? " waiting" : "")
            }
            onClick={cmd(c.fn, c.off, c.why)}
          >
            {HAS_KB && <span style="opacity:.5">{i + 1}</span>} {c.t}
            <span class="k">{c.k}</span>
          </button>
        ))}
      </div>

      <div id="flash" />
      <div id="critpulse" />

      {levelUp && (
        <LevelUpOverlay gains={levelUp} onDone={() => setLevelUp(null)} />
      )}
      {result && !levelUp && (
        <ResultOverlay
          result={result}
          onNext={() => {
            setResult(null);
            pushOn();
          }}
          onRetreat={() => {
            retreatToTown();
            go("town");
          }}
          onAfterDefeat={() => {
            afterDefeat();
            go("town");
          }}
          onZone={() => {
            openZoneId.value = b.zone?.id ?? null;
            afterDefeat();
            go("zone");
          }}
        />
      )}
    </section>
  );
}

function MobArt({ art, variant }: { art: SpriteKey; variant?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const src = spriteFor(art, variant);
    const cv = ref.current;
    if (!cv) return;
    cv.width = src.width;
    cv.height = src.height;
    const g = cv.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.drawImage(src, 0, 0);
  }, [art, variant]);
  return <canvas ref={ref} width={10} height={10} />;
}

function buffTagShort(b: { def?: number; evade?: number; lifesteal?: number; shield?: number; crit?: number }) {
  if (b.def) return "BLINDAJE";
  if (b.evade) return "ESQUIVA";
  if (b.lifesteal) return "DRENAJE";
  if (b.shield) return "ESCUDO";
  if (b.crit) return "CRÍTICO";
  return "+DAÑO";
}

function LevelUpOverlay({
  gains,
  onDone,
}: {
  gains: LevelGain[];
  onDone: () => void;
}) {
  const last = gains[gains.length - 1];
  const t = gains.reduce(
    (a, g) => ({
      dHp: a.dHp + g.dHp,
      dMp: a.dMp + g.dMp,
      dAtk: a.dAtk + g.dAtk,
      dDef: a.dDef + g.dDef,
      dLuck: a.dLuck + g.dLuck,
    }),
    { dHp: 0, dMp: 0, dAtk: 0, dDef: 0, dLuck: 0 },
  );
  const unlocked = gains.flatMap((g) => g.unlocked);
  return (
    <div class="overlay show">
      <div class="banner">
        <div class="tiny" style="color:var(--gold-deep);letter-spacing:3px">
          {gains.length > 1 ? gains.length + " NIVELES" : "NIVEL"}
        </div>
        <div class="big" style="margin:8px 0 16px">
          ¡NIVEL {last.lv}!
        </div>
        <div class="statgrid" style="width:240px;margin:0 auto;text-align:left">
          <div>
            <span>PV máx</span>
            <b class="up">+{t.dHp}</b>
          </div>
          <div>
            <span>PM máx</span>
            <b class="up">+{t.dMp}</b>
          </div>
          <div>
            <span>P. Ataque</span>
            <b class="up">+{t.dAtk}</b>
          </div>
          <div>
            <span>P. Defensa</span>
            <b class="up">+{t.dDef}</b>
          </div>
          <div>
            <span>Suerte</span>
            <b class="up">+{t.dLuck}</b>
          </div>
          <div>
            <span>PV / PM</span>
            <b class="up">pleno</b>
          </div>
        </div>
        {unlocked.length > 0 && (
          <p class="tiny" style="color:var(--gold-soft);margin-top:14px;max-width:240px">
            La Maestra de Habilidades ya puede enseñarte: {unlocked.join(", ")}.
          </p>
        )}
        <button class="btn gold" style="margin-top:20px;width:200px" onClick={onDone}>
          Seguir
        </button>
      </div>
    </div>
  );
}

function ResultOverlay({
  result,
  onNext,
  onRetreat,
  onAfterDefeat,
  onZone,
}: {
  result:
    | { kind: "victory"; data: VictoryData }
    | { kind: "defeat"; data: DefeatData };
  onNext: () => void;
  onRetreat: () => void;
  onAfterDefeat: () => void;
  onZone: () => void;
}) {
  const s = S();
  if (result.kind === "defeat") {
    const { lost, brokenRun } = result.data;
    return (
      <div class="overlay show">
        <div class="banner">
          <h2 style="color:var(--hp)">HAS CAÍDO</h2>
          <p class="muted" style="font-size:19px;margin:10px 0 4px">
            Te arrastran de vuelta al pueblo.
          </p>
          <p class="tiny" style="color:var(--parch-faint)">
            Perdés {fmt(lost)} adena y despertás a media salud.
          </p>
          {brokenRun && (
            <p class="tiny" style="color:var(--warn);margin-top:12px;max-width:250px">
              La expedición se corta acá. El botín ya es tuyo; la racha no.
            </p>
          )}
          <button
            class="btn gold"
            style="margin-top:22px;width:200px"
            onClick={onAfterDefeat}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  const { mob, rw, run, champNext } = result.data;
  const need = xpToNext(s.lv);
  const potN = count(1060) + count(1061);
  return (
    <div class="overlay show">
      <div class="banner">
        <h2>VICTORIA</h2>
        <p class="muted" style="font-size:18px;margin-bottom:4px">
          {mob} derrotado
        </p>
        {Math.abs(rw.mult - 1) > 0.001 && (
          <p
            class="tiny"
            style={`color:${rw.mult > 1 ? "var(--xp)" : "var(--warn)"};margin-bottom:10px`}
          >
            BOTÍN ×{rw.mult.toFixed(2)}
          </p>
        )}
        <div class="reward-line">
          <img src={itemIcon(57)} alt="" />+ {fmt(rw.adena)} adena
        </div>
        <div class="reward-line">
          + {fmt(rw.xp)} EXP&nbsp;&nbsp;·&nbsp;&nbsp;+ {fmt(rw.sp)} SP
        </div>
        <div style="width:220px;margin:8px auto 4px">
          <div class="bar xp">
            <i style={`right:${100 - (100 * s.xp) / need}%`} />
          </div>
          <div class="tiny muted num" style="margin-top:4px">
            {fmt(s.xp)} / {fmt(need)} · Nv {s.lv}
          </div>
        </div>
        <div style="margin:12px 0 4px">
          {rw.items.length ? (
            rw.items.map((it) => (
              <span
                key={it.id}
                class={"dropchip" + (it.rare ? " rare" : "")}
              >
                <img src={itemIcon(it.id)} alt="" />
                {it.rare ? "★ " : ""}
                {ITEMS[it.id].n}
                {it.q > 1 ? " ×" + it.q : ""}
              </span>
            ))
          ) : (
            <span class="tiny muted">Sin botín esta vez.</span>
          )}
        </div>
        {run && (
          <div style="width:220px;margin:14px auto 0">
            <div class="barlabel">
              <span>PV</span>
              <b class="num">
                {s.hp}/{s.hpMax}
              </b>
            </div>
            <div class="bar hp slim">
              <i style={`right:${100 - (100 * s.hp) / s.hpMax}%`} />
            </div>
            <p class="tiny muted" style="margin-top:7px">
              Racha {run.streak} · {fmt(run.adena)} adena en la mochila
            </p>
            {champNext === 0 ? (
              <p class="tiny" style="color:var(--gold);margin-top:5px">
                ★ LA PRÓXIMA ES UN CAMPEÓN
              </p>
            ) : champNext <= 3 ? (
              <p class="tiny" style="color:var(--gold-soft);margin-top:5px">
                Campeón en {champNext} presas
              </p>
            ) : null}
          </div>
        )}
        <div class="stack" style="margin-top:18px;width:220px">
          {run ? (
            <>
              <button class="btn gold" onClick={onNext}>
                Seguir cazando
              </button>
              <button class="btn ghost" onClick={onRetreat}>
                Retirarse al pueblo
              </button>
            </>
          ) : (
            <>
              <button class="btn gold" onClick={onZone}>
                Volver a la zona
              </button>
              <button class="btn ghost" onClick={onRetreat}>
                Al pueblo
              </button>
            </>
          )}
        </div>
        <span hidden>{potN}</span>
      </div>
    </div>
  );
}
