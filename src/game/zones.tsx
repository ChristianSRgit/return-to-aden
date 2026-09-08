import { MOBS, ZONES, RUN_STEP, RUN_CAP, ELITE_FROM, type ZoneDef } from "../data";
import { S } from "./state";
import { levelMult } from "./rng";
import { confirmModal } from "../ui/overlays";

export function zoneLv(z: ZoneDef): number {
  return Math.round(
    z.mobs.reduce((a, id) => a + MOBS[id].lv, 0) / z.mobs.length,
  );
}

export function dangerTag(avgLv: number): [string, string] {
  const d = avgLv - S().lv;
  if (d <= -3) return ["easy", "Fácil"];
  if (d <= 2) return ["fair", "A tu nivel"];
  if (d <= 6) return ["hard", "Peligroso"];
  return ["deadly", "Mortal"];
}

// No zone is locked. Only a confirm when you're way over your head.
export function riskCheck(mobLv: number, onYes: () => void) {
  const d = mobLv - S().lv;
  if (d <= 6) {
    onYes();
    return;
  }
  confirmModal(
    "Muy por encima de tu nivel",
    <>
      Eso te saca <b>{d} niveles</b>. Nadie te lo prohíbe, pero podés caer en
      pocos turnos.
      <br />
      <br />A cambio, el botín paga{" "}
      <b style="color:var(--xp)">×{levelMult(mobLv).toFixed(2)}</b>. ¿Vas igual?
    </>,
    onYes,
  );
}

export function suggestedZone(): ZoneDef {
  const s = S();
  if (s.run) {
    const z = ZONES.find((x) => x.id === s.run!.zone);
    if (z) return z;
  }
  if (s.lastZone) {
    const z = ZONES.find((x) => x.id === s.lastZone);
    if (z) return z;
  }
  const ok = ZONES.filter((z) => !z.boss && zoneLv(z) <= s.lv + 2);
  return ok[ok.length - 1] || ZONES[0];
}

export const RUN_STEP_PCT = Math.round(RUN_STEP * 100);
export const RUN_CAP_PCT = Math.round(RUN_CAP * 100);
export { ELITE_FROM };
