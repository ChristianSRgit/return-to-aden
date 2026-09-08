import { screen, TOWN_PANES } from "./router";
import { hasGame } from "./game/state";
import { TopBar } from "./ui/TopBar";
import { Wallet } from "./ui/Wallet";
import { TabBar } from "./ui/TabBar";
import { Overlays } from "./ui/overlays";
import { Title } from "./screens/Title";
import { ClassPick } from "./screens/ClassPick";
import { Town } from "./screens/Town";
import { Zones } from "./screens/Zones";
import { ZoneDetail } from "./screens/ZoneDetail";
import { Bestiary } from "./screens/Bestiary";
import { Shop } from "./screens/Shop";
import { Inventory } from "./screens/Inventory";
import { Skills } from "./screens/Skills";
import { Character } from "./screens/Character";
import { Battle } from "./screens/Battle";

export function App() {
  const id = screen.value;
  const inTown = hasGame() && TOWN_PANES.includes(id);

  return (
    <div id="cabinet">
      <div id="screen">
        <TopBar />
        {inTown && <Wallet />}
        <div id="view">
          {id === "title" && <Title />}
          {id === "pick" && <ClassPick />}
          {id === "town" && <Town />}
          {id === "zones" && <Zones />}
          {id === "zone" && <ZoneDetail />}
          {id === "bestiary" && <Bestiary />}
          {id === "shop" && <Shop />}
          {id === "inv" && <Inventory />}
          {id === "skills" && <Skills />}
          {id === "char" && <Character />}
          {id === "battle" && <Battle />}
        </div>
        {inTown && <TabBar />}
        <div id="crt" />
        <Overlays />
      </div>
    </div>
  );
}
