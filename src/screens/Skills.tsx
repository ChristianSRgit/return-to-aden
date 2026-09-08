import { rev, S, save } from "../game/state";
import { CLASSES, SKILLS, skillsOf, skillFits, itemIcon } from "../data";
import { fmt } from "../game/format";
import { toast } from "../ui/overlays";

function equipSkill(k: string) {
  const s = S();
  const i = s.loadout.indexOf(k);
  if (i >= 0) {
    if (s.loadout.length === 1) {
      toast("Necesitás al menos una habilidad equipada.");
      return;
    }
    s.loadout.splice(i, 1);
  } else {
    if (s.loadout.length >= 3) {
      toast("Ya tenés 3 habilidades equipadas.");
      return;
    }
    s.loadout.push(k);
  }
  save();
}
function learnSkill(k: string) {
  const s = S();
  const sk = SKILLS[k];
  if (typeof sk.cost !== "number") return;
  if (!skillFits(k, s.cls)) {
    toast("Esa habilidad no es de tu clase.");
    return;
  }
  if (s.sp < sk.cost) {
    toast("Te faltan " + (sk.cost - s.sp) + " SP.");
    return;
  }
  if (s.lv < (sk.req ?? 0)) {
    toast("Requiere nivel " + sk.req + ".");
    return;
  }
  s.sp -= sk.cost;
  s.known.push(k);
  if (s.loadout.length < 3) s.loadout.push(k);
  save();
  toast("Aprendiste " + sk.name + ".");
}

export function Skills() {
  rev.value;
  const s = S();
  const c = CLASSES[s.cls];
  const order = skillsOf(s.cls);
  const learned = order.filter((k) => s.known.includes(k)).length;

  return (
    <section class="pane show" id="skills">
      <div class="eyebrow">Maestra de Habilidades</div>
      <h2 class="section-title">Grimorio del Gremio</h2>
      <div
        class="panel"
        style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center"
      >
        <span class="tiny muted">SP disponible</span>
        <span class="coin">
          <img src={itemIcon(2509)} alt="" />
          {fmt(s.sp)} SP
        </span>
      </div>
      <div class="panel" style="margin-bottom:12px">
        <div class="tiny" style="color:var(--gold-deep);letter-spacing:.5px">
          SENDA DE {c.name.toUpperCase()}
        </div>
        <p style="margin:6px 0 8px;font-size:15px;line-height:1.4">{c.path}</p>
        <div class="tiny muted">
          {learned} de {order.length} habilidades de tu clase
        </div>
      </div>

      <div class="tiny" style="color:var(--gold-deep);margin-bottom:6px">
        SET DE COMBATE · {s.loadout.length}/3
      </div>
      <p class="tiny muted" style="margin-bottom:8px">
        Tocá una habilidad aprendida para equiparla o quitarla (máx. 3).
      </p>

      <div class="stack">
        {order.map((k) => {
          const sk = SKILLS[k];
          const known = s.known.includes(k);
          const equipped = s.loadout.includes(k);
          const lvlOk = s.lv >= (sk.req ?? 0);
          const spOk = s.sp >= (sk.cost ?? 0);
          let action: string;
          let disabled = false;
          if (equipped) action = "Quitar";
          else if (known) action = "Equipar";
          else if (!lvlOk) {
            action = "Nv " + sk.req;
            disabled = true;
          } else if (!spOk) {
            action = "faltan " + fmt((sk.cost ?? 0) - s.sp) + " SP";
            disabled = true;
          } else action = fmt(sk.cost ?? 0) + " SP";
          // Only a skill you can actually buy right now is gold. A locked or
          // unaffordable one reads as inert.
          const cls = equipped
            ? "btn ghost"
            : known
              ? "btn"
              : disabled
                ? "btn ghost"
                : "btn gold";
          return (
            <div
              class="row"
              key={k}
              style={`border-color:${equipped ? "var(--cyan-deep)" : "var(--hair)"};${
                equipped ? "box-shadow:inset 0 0 14px rgba(52,209,196,.07);" : ""
              }${!known && !lvlOk ? "opacity:.55" : ""}`}
            >
              <div class="meta">
                <div class="nm">
                  {sk.name}
                  {sk.starter ? " (inicial)" : ""}
                  {equipped ? " — EN SET" : ""}
                </div>
                <div class="dt">
                  {sk.txt} · {sk.mp} PM
                  {!known && sk.req ? ` · requiere Nv ${sk.req}` : ""}
                  {sk.cls === null ? " · común" : ""}
                </div>
              </div>
              <button
                class={cls}
                style="flex:0 0 auto;font-size:13px;padding:9px 8px"
                disabled={disabled}
                onClick={() => (known ? equipSkill(k) : learnSkill(k))}
              >
                {action}
              </button>
            </div>
          );
        })}
      </div>
      <div class="spacer" />
    </section>
  );
}
