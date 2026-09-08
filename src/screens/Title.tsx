import { useLayoutEffect, useRef } from "preact/hooks";
import { drawCrest } from "../art/hub";
import { CLASSES } from "../data";
import { loadSave, setState, save, hasStorage, saveStatus } from "../game/state";
import { retroSp } from "../game/progression";
import { fmt } from "../game/format";
import { go } from "../router";
import { confirmModal, toast } from "../ui/overlays";
import { sfx } from "../game/audio";

export function Title() {
  const crest = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    if (crest.current) drawCrest(crest.current);
    if (!hasStorage()) saveStatus.value = "warn";
  }, []);

  const saved = loadSave();

  return (
    <section class="pane show" id="title">
      <div class="logo">
        <canvas ref={crest} class="crest" width={92} height={92} />
        <div class="top">LINEAGE</div>
        <div class="main">
          RETURN
          <br />
          TO ADEN
        </div>
        <div class="sub">
          Un cazador vuelve al reino.
          <br />
          Datos reales de Interlude.
        </div>
      </div>
      <div class="spacer" />
      <div class="stack" id="titleActions">
        {saved ? (
          <>
            <button
              class="btn gold"
              onClick={() => {
                sfx("ui");
                const migrated = saved._migrated;
                const refund = saved._refund;
                delete saved._migrated;
                delete saved._refund;
                setState(saved);
                save();
                go("town");
                if (migrated)
                  toast(
                    "Partida actualizada: +" +
                      fmt(retroSp(saved.lv)) +
                      " SP acumulado y tu arma equipada.",
                  );
                else if (refund)
                  toast(
                    "Cada clase tiene ahora su rama de skills. Te devolvimos " +
                      fmt(refund) +
                      " SP.",
                  );
              }}
            >
              Continuar
              <span style="opacity:.7">
                {" "}
                · {CLASSES[saved.cls].name} Nv {saved.lv}
              </span>
            </button>
            <button
              class="btn ghost"
              onClick={() =>
                confirmModal(
                  "Empezar de nuevo",
                  `Se borrará la partida guardada de ${CLASSES[saved.cls].name} (Nivel ${saved.lv}). ¿Seguro?`,
                  () => go("pick"),
                )
              }
            >
              Nuevo viaje
            </button>
          </>
        ) : (
          <button class="btn gold" onClick={() => { sfx("ui"); go("pick"); }}>
            Comenzar
          </button>
        )}
      </div>
      <p class="tiny muted center" style="margin-top:18px">
        El progreso se guarda solo en este navegador.
        <br />
        Sin cuenta. Sin servidor.
      </p>
      <div class="spacer" />
    </section>
  );
}
