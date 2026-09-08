import { render } from "preact";
import { registerSW } from "virtual:pwa-register";
import "./styles/game.css";
import { App } from "./app";
import { armAudioUnlock } from "./game/audio";
import { revalidateData } from "./data/refresh";

armAudioUnlock();
registerSW({ immediate: true });
revalidateData();

render(<App />, document.getElementById("app")!);
