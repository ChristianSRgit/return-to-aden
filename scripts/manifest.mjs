// Curated id lists that drive the build-time data fetch (`npm run data`).
// The fetch script pulls the full raw API payload for each of these; the
// game-design curation (which drops to surface, tuning, zones) lives in
// src/data/*.ts on top of the generated snapshot.
//
// Names/stats/icons always come from l2api.dev — never hand-typed here.

export const API_BASE = "https://l2api.dev/api/interlude";
export const ICON_BASE = "https://l2api.dev/icons";

// Every monster the bestiary can spawn. Real Interlude npc ids.
export const MONSTER_IDS = [
  18342, // Gremlin            lv1
  20481, // Bearded Keltir     lv1
  20432, // Elpy               lv1
  20120, // Wolf               lv4
  20003, // Goblin             lv5
  20468, // Kaboo Orc          lv6
  20132, // Werewolf           lv9
  20093, // Orc Fighter        lv10
  20008, // Felim Lizardman    lv14
  20022, // Misery Skeleton    lv14
  20103, // Giant Spider       lv15
  20479, // Kasha Bear         lv15
  20109, // Salamander         lv17
  20147, // Hobgoblin          lv21
  20154, // Mandragora Sprout  lv21
  20053, // Ol Mahum Patrol    lv21
  20205, // Dire Wolf          lv24
  20495, // Turek Orc Warlord  lv30
  20083, // Granite Golem      lv33
  20192, // Tyrant             lv35
  20144, // Hangman Tree       lv35 (raid)
];

// Items the shop / armoury / consumables need that are NOT necessarily in a
// monster drop table. Drop-table items are discovered automatically.
export const ITEM_IDS = [
  57,   // Adena
  1060, // Lesser Healing Potion
  1061, // Healing Potion
  1835, // Soulshot: No Grade
  2509, // Spiritshot: No Grade
  1,    // Short Sword
  10,   // Dagger
  8,    // Willow Staff
  13,   // Short Bow
  3,    // Broadsword
  257,  // Viper's Fang
  43,   // Wooden Helmet
  49,   // Gloves
  37,   // Leather Shoes
  393,  // Mithril Banded Mail
  20,   // Buckler
  116,  // Magic Ring
  112,  // Apprentice's Earring
  118,  // Necklace of Magic
];

// Small catalog endpoints fetched whole.
export const CATALOGS = ["classes", "locations"];
