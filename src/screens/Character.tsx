import { rev, S, wipeSave, setState } from "../game/state";
import { CLASSES, SKILLS, SLOTS, ITEMS } from "../data";
import { xpToNext } from "../game/progression";
import { critChance } from "../game/battle";
import { gearLine } from "../game/equipment";
import { MILES, mileClaimed, milesReady } from "../game/milestones";
import { fmt } from "../game/format";
import { go } from "../router";
import { confirmModal, modal } from "../ui/overlays";
import { MilesModal, ChronicleModal, BackupModal } from "./modals";
import { sfxOn, toggleSfx } from "../game/audio";
import { settings, setMotion, type MotionPref } from "../game/settings";
import { speed, cycleSpeed } from "../game/battle";

export function Character() {
  rev.value;
  const s = S();
  const c = CLASSES[s.cls];
  const need = xpToNext(s.lv);
  const claimed = MILES.filter(mileClaimed).length;
  const ready = milesReady();

  return (
    <section class="pane show" id="char">
      <div class="eyebrow">Personaje</div>
      <h2 class="section-title">
        {c.name} · Nivel {s.lv}
      </h2>

      <div class="card" style="margin-bottom:12px">
        <div class="barlabel">
          <span>EXPERIENCIA</span>
          <b class="num">
            {fmt(s.xp)} / {fmt(need)}
          </b>
        </div>
        <div class="bar xp">
          <i style={`right:${100 - (100 * s.xp) / need}%`} />
        </div>
        <hr class="rule" />
        <div class="statgrid">
          <div>
            <span>PV máx</span>
            <b>{s.hpMax}</b>
          </div>
          <div>
            <span>PM máx</span>
            <b>{s.mpMax}</b>
          </div>
          <div>
            <span>P. Ataque</span>
            <b>{s.pAtk}</b>
          </div>
          <div>
            <span>P. Defensa</span>
            <b>{s.pDef}</b>
          </div>
          <div>
            <span>Suerte</span>
            <b>{s.luck}</b>
          </div>
          <div>
            <span>Crítico</span>
            <b>{Math.round(critChance() * 100)}%</b>
          </div>
          <div>
            <span>SP</span>
            <b class="up">{fmt(s.sp)}</b>
          </div>
          <div>
            <span>Habilidades</span>
            <b>
              {s.known.length} · {s.loadout.length}/3
            </b>
          </div>
        </div>
        <hr class="rule" />
        <div class="tiny" style="color:var(--gold-deep);margin-bottom:6px">
          EQUIPO
        </div>
        {SLOTS.map((sl) => {
          const id = s.gear[sl.k];
          return (
            <p style="font-size:18px;margin-bottom:3px" key={sl.k}>
              <span class="muted">{sl.label}: </span>
              {id != null ? (
                <>
                  <b style="color:var(--gold-soft)">{ITEMS[id].n}</b>{" "}
                  <span class="muted">· {gearLine(id)}</span>
                </>
              ) : (
                <span style="color:var(--parch-faint)">{sl.empty}</span>
              )}
            </p>
          );
        })}
        <p class="tiny" style="color:var(--parch-faint);margin-top:6px">
          Base sin equipo: {s.base.pAtk} P.ATK · {s.base.pDef} P.DEF ·{" "}
          {s.base.luck} SUERTE
        </p>
        <button
          class="btn ghost"
          style="font-size:13px;margin-top:8px"
          onClick={() => go("inv")}
        >
          Cambiar equipo ›
        </button>
        <hr class="rule" />
        <div class="tiny" style="color:var(--gold-deep)">
          SET DE COMBATE
        </div>
        {s.loadout.map((k) => (
          <p style="font-size:19px;margin-top:4px" key={k}>
            <b style="color:var(--gold-soft)">{SKILLS[k].name}</b> — {SKILLS[k].txt}{" "}
            · {SKILLS[k].mp} PM
          </p>
        ))}
        <button
          class="btn ghost"
          style="font-size:13px;margin-top:10px"
          onClick={() => go("skills")}
        >
          Maestra de Habilidades ›
        </button>
        {c.perk && (
          <p class="tiny" style="color:var(--rare);margin-top:8px">
            RASGO: +{Math.round((c.perk.drop - 1) * 100)}% caída de objetos, +
            {Math.round((c.perk.adena - 1) * 100)}% adena.
          </p>
        )}
      </div>

      <div class="card" style="margin-bottom:12px">
        <div class="tiny" style="color:var(--gold-deep);margin-bottom:8px">
          CRÓNICA
        </div>
        <button
          class="btn ghost"
          style="font-size:13px"
          onClick={() => (modal.value = ChronicleModal())}
        >
          Ver crónica
        </button>
        <button
          class={"btn " + (ready ? "gold" : "ghost")}
          style="font-size:13px;margin-top:8px"
          onClick={() => (modal.value = MilesModal())}
        >
          Hitos · {claimed}/{MILES.length}
          {ready ? ` · ¡${ready} para cobrar!` : ""}
        </button>
      </div>

      <div class="card" style="margin-bottom:12px">
        <div class="tiny" style="color:var(--gold-deep);margin-bottom:10px">
          AJUSTES
        </div>
        <div class="setrow">
          <span>Sonido</span>
          <button class="btn ghost" onClick={toggleSfx}>
            {sfxOn.value ? "Encendido" : "Apagado"}
          </button>
        </div>
        <div class="setrow">
          <span>Velocidad de combate</span>
          <button class="btn ghost" onClick={cycleSpeed}>
            ×{speed.value}
          </button>
        </div>
        <div class="setrow">
          <span>Animaciones</span>
          <div class="segbtn">
            {(
              [
                ["auto", "Auto"],
                ["full", "Todas"],
                ["reduced", "Mínimas"],
              ] as [MotionPref, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                class={settings.value.motion === v ? "on" : ""}
                onClick={() => setMotion(v)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p class="tiny muted" style="margin-top:8px">
          "Mínimas" corta el temblor de pantalla y las partículas. "Auto" sigue
          la preferencia del sistema.
        </p>
      </div>

      <div class="panel">
        <button
          class="btn ghost"
          style="font-size:13px"
          onClick={() => (modal.value = BackupModal())}
        >
          Copia de seguridad
        </button>
        <button
          class="btn danger"
          style="font-size:13px;margin-top:8px"
          onClick={() =>
            confirmModal(
              "Borrar partida",
              "Esto elimina tu progreso de este navegador para siempre. ¿Seguro?",
              () => {
                wipeSave();
                setState(null);
                go("title");
              },
            )
          }
        >
          Borrar partida
        </button>
      </div>
      <div class="spacer" />
    </section>
  );
}
