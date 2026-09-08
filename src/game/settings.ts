// Player-facing display settings, persisted separately from the save so they
// survive "borrar partida". The battle engine and FX layer read `motionOff()`.

import { signal, effect } from "@preact/signals";

const KEY = "returnToAden.settings";

// "auto" follows the OS "reduce motion" preference.
export type MotionPref = "auto" | "full" | "reduced";

interface Settings {
  motion: MotionPref;
  onboarded: boolean;
}

const DEFAULTS: Settings = { motion: "auto", onboarded: false };

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULTS };
}

export const settings = signal<Settings>(load());

effect(() => {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings.value));
  } catch {
    /* ignore */
  }
});

const osReduce =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** True when shake / particles / non-essential animation should be suppressed. */
export function motionOff(): boolean {
  const p = settings.value.motion;
  return p === "reduced" ? true : p === "full" ? false : osReduce;
}

export function setMotion(p: MotionPref) {
  settings.value = { ...settings.value, motion: p };
}

export function markOnboarded() {
  if (!settings.value.onboarded)
    settings.value = { ...settings.value, onboarded: true };
}
