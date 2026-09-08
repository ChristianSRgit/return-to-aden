import { saveStatus, hasGame, S, rev } from "../game/state";
import { sfxOn, toggleSfx, sfx } from "../game/audio";
import { screen, go, TOWN_PANES } from "../router";
import { runMult } from "../game/rng";

export function TopBar() {
  rev.value;
  const s = hasGame() ? S() : null;
  const run = s?.run;
  const st = saveStatus.value;
  const inRunBattle = !!run && screen.value === "battle";
  return (
    <div id="topbar">
      <button
        id="tbTitle"
        hidden={inRunBattle}
        onClick={() => {
          if (s && TOWN_PANES.includes(screen.value) && screen.value !== "town") {
            sfx("ui");
            go("town");
          }
        }}
      >
        RETURN&nbsp;TO&nbsp;ADEN
      </button>
      {inRunBattle ? (
        <span
          id="runInd"
          class={runMult() - 1 >= 0.48 ? "hot" : ""}
        >
          RACHA {run.streak} · +{Math.round((runMult() - 1) * 100)}%
        </span>
      ) : null}
      <span class="tbright">
        <button
          class={"tbtn" + (sfxOn.value ? " on" : "")}
          aria-pressed={sfxOn.value}
          onClick={toggleSfx}
        >
          ♪ {sfxOn.value ? "ON" : "OFF"}
        </button>
        <span class={"save" + (st === "ok" ? " on" : st === "warn" ? " warn" : "")}>
          <span class="dot" />
          <span>{st === "warn" ? "sin guardado" : st === "ok" ? "guardado" : "•"}</span>
        </span>
      </span>
    </div>
  );
}
