import { rev, S } from "../game/state";
import { screen, tab, type ScreenId } from "../router";
import { itemIcon, GEAR, SKILLS, skillsOf } from "../data";
import { uiIcon } from "../art/pixels";
import { milesReady } from "../game/milestones";

const TABS: {
  id: ScreenId;
  ic?: number;
  ui?: string;
  tx: string;
  main?: boolean;
}[] = [
  { id: "shop", ic: 57, tx: "Tienda" },
  { id: "inv", ic: 20, tx: "Equipo" },
  { id: "town", ui: "swords", tx: "Pueblo", main: true },
  { id: "skills", ui: "book", tx: "Skills" },
  { id: "char", ic: 43, tx: "Perfil" },
];

function tabFor(pane: ScreenId): ScreenId {
  return pane === "zones" || pane === "zone" || pane === "bestiary"
    ? "town"
    : pane;
}

function tabAlert(id: ScreenId): boolean {
  const s = S();
  if (id === "inv")
    return Object.keys(s.inv)
      .map(Number)
      .some((i) => {
        const g = GEAR[i];
        if (!g || (s.inv[i] ?? 0) <= 0) return false;
        const curId = s.gear[g.slot];
        const cur = curId != null ? GEAR[curId] : undefined;
        const val = (o?: Record<string, number>) =>
          Object.values(o || {}).reduce((a, v) => a + v, 0);
        return val(g.b) > val(cur?.b);
      });
  if (id === "skills")
    return skillsOf(s.cls).some((k) => {
      const sk = SKILLS[k];
      return (
        !sk.starter &&
        !s.known.includes(k) &&
        s.lv >= (sk.req ?? 99) &&
        s.sp >= (sk.cost ?? Infinity)
      );
    });
  if (id === "char") return milesReady() > 0;
  return false;
}

export function TabBar() {
  rev.value;
  const active = tabFor(screen.value);
  return (
    <nav id="tabbar" class="on">
      {TABS.map((tb) => (
        <button
          key={tb.id}
          class={"tab" + (tb.main ? " main" : "") + (active === tb.id ? " sel" : "")}
          onClick={() => tab(tb.id)}
        >
          {tabAlert(tb.id) && <span class="dot" />}
          <img
            class="ic"
            src={tb.ui ? uiIcon(tb.ui) : itemIcon(tb.ic!)}
            alt={tb.tx}
            title={tb.tx}
            style={`width:${tb.main ? 42 : 33}px;height:${tb.main ? 42 : 33}px`}
          />
        </button>
      ))}
    </nav>
  );
}
