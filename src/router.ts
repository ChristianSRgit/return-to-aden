import { signal } from "@preact/signals";
import { sfx } from "./game/audio";

export type ScreenId =
  | "title"
  | "pick"
  | "town"
  | "zones"
  | "zone"
  | "bestiary"
  | "battle"
  | "shop"
  | "inv"
  | "skills"
  | "char";

export const TOWN_PANES: ScreenId[] = [
  "town",
  "zones",
  "zone",
  "bestiary",
  "shop",
  "inv",
  "skills",
  "char",
];

export const screen = signal<ScreenId>("title");
export const prevScreen = signal<ScreenId>("title");
// zone currently opened in the ZoneDetail screen
export const openZoneId = signal<string | null>(null);

export function go(id: ScreenId) {
  if (id === screen.value) return;
  prevScreen.value = screen.value;
  screen.value = id;
}

export function tab(id: ScreenId) {
  sfx("ui");
  if (screen.value === id) {
    if (id === "town") return;
    const back = TOWN_PANES.includes(prevScreen.value) ? prevScreen.value : "town";
    go(back);
    return;
  }
  go(id);
}
