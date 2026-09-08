// Build-time data snapshot. Pulls real Lineage II Interlude data from
// l2api.dev into src/data/generated/*.json and downloads every referenced
// icon PNG into public/icons/. Run with `npm run data`.
//
// The game reads the snapshot so it works fully offline; src/data/refresh.ts
// revalidates against the live API in the background at runtime.

import { mkdir, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  API_BASE,
  ICON_BASE,
  MONSTER_IDS,
  ITEM_IDS,
  CATALOGS,
} from "./manifest.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DATA = join(ROOT, "src", "data", "generated");
const OUT_ICONS = join(ROOT, "public", "icons");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const body = await res.json();
      return body.data ?? body;
    } catch (err) {
      if (i === tries - 1) throw new Error(`GET ${url} failed: ${err.message}`);
      await sleep(400 * (i + 1));
    }
  }
}

async function downloadIcon(file) {
  if (!file) return;
  const dest = join(OUT_ICONS, file);
  if (existsSync(dest)) return;
  try {
    const res = await fetch(`${ICON_BASE}/${file}`);
    if (!res.ok) throw new Error(`${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(dest, buf);
    console.log(`  icon  ${file}`);
  } catch (err) {
    console.warn(`  icon  ${file}  — SKIPPED (${err.message})`);
  }
}

async function main() {
  await mkdir(OUT_DATA, { recursive: true });
  await mkdir(OUT_ICONS, { recursive: true });

  const icons = new Set();

  // --- monsters + their full drop tables --------------------------------
  const monsters = {};
  const drops = {};
  for (const id of MONSTER_IDS) {
    console.log(`monster ${id}`);
    const m = await getJSON(`${API_BASE}/monsters/${id}`);
    const d = await getJSON(`${API_BASE}/monsters/${id}/drops`);
    monsters[id] = m;
    drops[id] = d.drops ?? [];
    if (m.raceIconFile) icons.add(m.raceIconFile);
  }

  // --- items: explicit list ∪ everything a drop table references --------
  const itemIds = new Set(ITEM_IDS);
  for (const list of Object.values(drops))
    for (const row of list) itemIds.add(row.itemId);

  const items = {};
  for (const id of [...itemIds].sort((a, b) => a - b)) {
    console.log(`item ${id}`);
    const it = await getJSON(`${API_BASE}/items/${id}`);
    items[id] = it;
    if (it.iconFile) icons.add(it.iconFile);
  }

  // --- small catalogs fetched whole -----------------------------------
  const catalogs = {};
  for (const name of CATALOGS) {
    console.log(`catalog ${name}`);
    catalogs[name] = await getJSON(`${API_BASE}/${name}`);
  }

  // --- icons ---------------------------------------------------------
  console.log(`icons (${icons.size})`);
  for (const file of icons) await downloadIcon(file);

  // --- write snapshot ----------------------------------------------
  const write = (name, obj) =>
    writeFile(join(OUT_DATA, name), JSON.stringify(obj, null, 2) + "\n");

  await write("monsters.json", monsters);
  await write("drops.json", drops);
  await write("items.json", items);
  await write("classes.json", catalogs.classes ?? []);
  await write("locations.json", catalogs.locations ?? []);

  const iconList = (await readdir(OUT_ICONS)).filter((f) => f.endsWith(".png"));
  const meta = {
    source: API_BASE,
    fetchedAt: new Date().toISOString(),
    counts: {
      monsters: Object.keys(monsters).length,
      items: Object.keys(items).length,
      icons: iconList.length,
    },
  };
  await write("snapshot.meta.json", meta);

  console.log("\nsnapshot written to src/data/generated/");
  console.table(meta.counts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
