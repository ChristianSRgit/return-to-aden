import { useState } from "preact/hooks";
import { CLASSES, SKILLS, ITEMS, type ClassKey } from "../data";
import { HeroSprite } from "../ui/Sprite";
import { newGame } from "../game/state";
import { go } from "../router";
import { sfx } from "../game/audio";

export function ClassPick() {
  const [picked, setPicked] = useState<ClassKey | null>(null);
  return (
    <section class="pane show" id="pick">
      <div class="eyebrow">Nuevo viaje</div>
      <h2 class="section-title">Elegí tu senda</h2>
      <div class="classpick">
        {Object.values(CLASSES).map((c) => (
          <button
            key={c.key}
            class={"classcard" + (picked === c.key ? " sel" : "")}
            onClick={() => {
              sfx("ui");
              setPicked(c.key);
            }}
          >
            <div class="por">
              <HeroSprite
                cls={c.key}
                gear={{ wpn: c.wpn, arm: null, shd: null, acc: null }}
              />
            </div>
            <div>
              <div class="nm">{c.name}</div>
              <div class="ds">{c.desc}</div>
              <div class="st">
                PV {c.base.hp} · PM {c.base.mp} · P.ATK {c.base.pAtk} · P.DEF{" "}
                {c.base.pDef} · SUERTE {c.base.luck}
              </div>
              <div class="st" style="color:var(--gold-deep)">
                SENDA: {c.path}
              </div>
              <div class="st">
                SKILL INICIAL: {SKILLS[c.start].name} — {SKILLS[c.start].txt}
                {c.perk ? " · +botín, +adena" : ""}
              </div>
              <div class="st">MUNICIÓN: {ITEMS[c.shot].n.split(":")[0]}</div>
            </div>
          </button>
        ))}
      </div>
      <div class="spacer" />
      <button
        class="btn gold"
        style="margin-top:14px"
        disabled={!picked}
        onClick={() => {
          if (!picked) return;
          newGame(picked);
          go("town");
        }}
      >
        Partir hacia Aden
      </button>
    </section>
  );
}
