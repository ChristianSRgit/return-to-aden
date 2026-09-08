import { S } from "../game/state";
import { fmt } from "../game/format";
import { CLASSES } from "../data";
import {
  MILES,
  mileDone,
  mileClaimed,
  mileReward,
  claimMile,
} from "../game/milestones";
import { closeModal, toast, modal } from "../ui/overlays";
import { normalize, validSave, setState, save } from "../game/state";
import { go } from "../router";

export function IntroModal() {
  return {
    title: "Volviste a Aden",
    body: (
      <div style="font-size:18px;line-height:1.5">
        <p style="margin-bottom:8px">
          Sos un cazador que vuelve al reino. El pueblo es tu base: descansás,
          reponés pociones y comprás equipo acá.
        </p>
        <p style="margin-bottom:8px">
          <b style="color:var(--gold-soft)">Iniciar expedición</b> te manda a
          cazar. Cada presa encadenada sube el botín; si caés, perdés la racha
          pero el botín ya es tuyo.
        </p>
        <p>
          Subir de nivel te cura y te abre habilidades nuevas en la{" "}
          <b style="color:var(--gold-soft)">Maestra de Habilidades</b>. Todo se
          guarda solo.
        </p>
      </div>
    ),
    actions: [
      { label: "A cazar", kind: "gold" as const, onClick: closeModal },
    ],
  };
}

export function MilesModal() {
  const rows = MILES.map((m) => {
    const done = mileDone(m);
    const got = mileClaimed(m);
    const pct = Math.min(100, (100 * m.cur()) / m.goal);
    return (
      <div
        key={m.id}
        class={"milerow" + (done && !got ? " ready" : "") + (got ? " got" : "")}
      >
        <div class="mr-t">
          <span>
            <b>{m.t}</b> · {m.d}
          </span>
          <b>
            {got ? "✓" : done ? "listo" : `${fmt(Math.min(m.cur(), m.goal))}/${fmt(m.goal)}`}
          </b>
        </div>
        <div class="bar xp slim">
          <i style={`right:${100 - pct}%`} />
        </div>
        <div class="mr-d">→ {mileReward(m)}</div>
        {done && !got && (
          <button
            class="btn gold"
            style="font-size:13px;margin-top:6px"
            onClick={() => {
              claimMile(m);
              toast(`¡${m.t}! +${mileReward(m)}`);
              modal.value = MilesModal();
            }}
          >
            Cobrar
          </button>
        )}
      </div>
    );
  });
  return {
    title: "Hitos",
    body: <div style="max-height:52vh;overflow-y:auto">{rows}</div>,
    actions: [{ label: "Cerrar", kind: "ghost" as const, onClick: closeModal }],
  };
}

export function ChronicleModal() {
  const s = S();
  const st = s.stats;
  const days = Math.max(1, Math.round((Date.now() - st.started) / 86400000));
  return {
    title: "Crónica",
    body: (
      <div class="statgrid">
        <div>
          <span>Clase</span>
          <b>{CLASSES[s.cls].name}</b>
        </div>
        <div>
          <span>Nivel</span>
          <b>{s.lv}</b>
        </div>
        <div>
          <span>Presas</span>
          <b>{fmt(st.kills)}</b>
        </div>
        <div>
          <span>Muertes</span>
          <b>{fmt(st.deaths)}</b>
        </div>
        <div>
          <span>Mejor racha</span>
          <b>{fmt(st.bestStreak)}</b>
        </div>
        <div>
          <span>Expediciones</span>
          <b>{fmt(st.runs)}</b>
        </div>
        <div>
          <span>Raids</span>
          <b>{fmt(st.raids)}</b>
        </div>
        <div>
          <span>Golpe máximo</span>
          <b>{fmt(st.best)}</b>
        </div>
        <div>
          <span>Botín total</span>
          <b>{fmt(st.drops)}</b>
        </div>
        <div>
          <span>Días en Aden</span>
          <b>{days}</b>
        </div>
      </div>
    ),
    actions: [{ label: "Cerrar", kind: "ghost" as const, onClick: closeModal }],
  };
}

export function BackupModal() {
  const dump = JSON.stringify(S());
  return {
    title: "Copia de seguridad",
    body: (
      <div>
        <p class="tiny muted" style="margin-bottom:8px">
          Copiá este texto para guardar tu partida, o pegá uno viejo para
          restaurarla.
        </p>
        <textarea
          readOnly
          onClick={(e) => (e.currentTarget as HTMLTextAreaElement).select()}
        >
          {dump}
        </textarea>
        <button
          class="btn ghost"
          style="font-size:13px;margin-top:8px"
          onClick={() => {
            const text = prompt("Pegá el texto de una copia de seguridad:");
            if (!text) return;
            try {
              const d = JSON.parse(text);
              if (!validSave(d)) throw 0;
              const fixed = normalize(d);
              if (!fixed) throw 0;
              setState(fixed);
              save();
              closeModal();
              toast("Partida restaurada.");
              go("town");
            } catch {
              toast("Ese texto no es una partida válida.");
            }
          }}
        >
          Restaurar de texto
        </button>
      </div>
    ),
    actions: [{ label: "Cerrar", kind: "ghost" as const, onClick: closeModal }],
  };
}
