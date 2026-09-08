// Background revalidation. On boot, if online, re-fetch the monsters and
// items the game uses and patch names / stats / prices in place. The build
// snapshot is always the offline fallback; this never blocks the UI and
// never throws.

import { MOBS, ITEMS } from "./index";

const API =
  (import.meta.env.VITE_DATA_PROXY as string | undefined) ??
  "https://l2api.dev/api/interlude";

export const dataVersion = { fetchedAt: null as string | null, patched: 0 };

async function getJSON(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const body = await res.json();
    return body.data ?? body;
  } catch {
    return null;
  }
}

// l2api.dev does not send CORS headers for browser requests from arbitrary
// origins, so a direct runtime fetch fails. The build snapshot (npm run data)
// is the real data path. To enable live refresh, point VITE_DATA_PROXY at a
// CORS-friendly proxy of l2api.dev (or run one on the deploy origin).
const PROXY = import.meta.env.VITE_DATA_PROXY as string | undefined;

export function revalidateData() {
  if (!PROXY) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  setTimeout(runRevalidate, 2500);
}

async function runRevalidate() {
  let patched = 0;
  for (const m of Object.values(MOBS)) {
    const raw = await getJSON(`${API}/monsters/${m.id}`);
    if (!raw) continue;
    if (typeof raw.name === "string" && raw.name !== m.n) {
      m.n = raw.name;
      patched++;
    }
    if (raw.stats) {
      for (const [k, prop] of [
        ["hp", "hp"],
        ["exp", "exp"],
        ["sp", "sp"],
        ["pAtk", "pAtk"],
        ["pDef", "pDef"],
      ] as const) {
        if (typeof raw.stats[k] === "number" && raw.stats[k] !== (m as any)[prop]) {
          (m as any)[prop] = raw.stats[k];
          patched++;
        }
      }
    }
    if (typeof raw.level === "number") m.lv = raw.level;
  }
  for (const it of Object.values(ITEMS)) {
    const raw = await getJSON(`${API}/items/${it.id}`);
    if (!raw) continue;
    if (typeof raw.name === "string" && raw.name !== it.n) {
      it.n = raw.name;
      patched++;
    }
    if (typeof raw.price === "number" && raw.price > 0) it.price = raw.price;
    if (typeof raw.iconFile === "string") it.ic = raw.iconFile;
  }
  dataVersion.fetchedAt = new Date().toISOString();
  dataVersion.patched = patched;
}
