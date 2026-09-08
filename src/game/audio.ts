// Synthesised sound — no audio files, so the app stays self-contained.
// Browsers refuse to start an AudioContext outside a user gesture, so the
// context is created lazily on the first tap and resumed there too.

import { signal } from "@preact/signals";

const SFX_KEY = "returnToAden.sfx";
export const sfxOn = signal(true);
try {
  sfxOn.value = localStorage.getItem(SFX_KEY) !== "0";
} catch {
  /* ignore */
}

export function toggleSfx() {
  sfxOn.value = !sfxOn.value;
  try {
    localStorage.setItem(SFX_KEY, sfxOn.value ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (sfxOn.value) sfx("ui");
}

let AC: AudioContext | null | false = null;
function audioCtx(): AudioContext | false {
  if (AC !== null) return AC;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    AC = new Ctor();
  } catch {
    AC = false;
  }
  return AC;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = "square",
  vol = 0.05,
  slideTo?: number,
  delay = 0,
) {
  const ac = audioCtx();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(ac.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.03);
}
function noise(dur: number, vol = 0.05) {
  const ac = audioCtx();
  if (!ac) return;
  const n = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  g.gain.value = vol;
  src.connect(g);
  g.connect(ac.destination);
  src.start();
}

const SFX: Record<string, () => void> = {
  ui: () => tone(620, 0.035, "square", 0.025, 520),
  hit: () => {
    noise(0.07, 0.05);
    tone(170, 0.08, "square", 0.04, 80);
  },
  crit: () => {
    noise(0.13, 0.08);
    tone(340, 0.18, "sawtooth", 0.055, 90);
  },
  miss: () => tone(320, 0.07, "sine", 0.03, 210),
  skill: () => {
    tone(520, 0.13, "triangle", 0.05, 980);
    tone(780, 0.1, "sine", 0.03, 1300, 0.05);
  },
  heal: () => {
    tone(660, 0.1, "sine", 0.045, 990);
    tone(880, 0.12, "sine", 0.04, 1180, 0.08);
  },
  hurt: () => {
    noise(0.09, 0.05);
    tone(200, 0.15, "sawtooth", 0.05, 70);
  },
  coin: () => {
    tone(1000, 0.05, "square", 0.035);
    tone(1500, 0.07, "square", 0.03, undefined, 0.05);
  },
  equip: () => {
    noise(0.05, 0.05);
    tone(420, 0.07, "square", 0.04, 600);
  },
  level: () =>
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(f, 0.16, "square", 0.045, undefined, i * 0.09),
    ),
  win: () =>
    [660, 880].forEach((f, i) =>
      tone(f, 0.18, "triangle", 0.045, undefined, i * 0.1),
    ),
  lose: () => tone(300, 0.55, "sawtooth", 0.05, 70),
  streak: () => {
    tone(880, 0.07, "square", 0.035);
    tone(1320, 0.09, "square", 0.03, undefined, 0.06);
  },
  swing: () => noise(0.05, 0.035),
  cast: () => {
    tone(280, 0.2, "sine", 0.035, 900);
    tone(560, 0.14, "triangle", 0.025, 1400, 0.06);
  },
};

export function sfx(name: string) {
  if (!sfxOn.value) return;
  const fn = SFX[name];
  if (!fn) return;
  const ac = audioCtx();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});
  try {
    fn();
  } catch {
    /* ignore */
  }
}

// one-time unlock on first pointer gesture
let unlocked = false;
export function armAudioUnlock() {
  if (unlocked) return;
  unlocked = true;
  const unlock = () => {
    const ac = audioCtx();
    if (ac && ac.state === "suspended") ac.resume().catch(() => {});
    window.removeEventListener("pointerdown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
}
