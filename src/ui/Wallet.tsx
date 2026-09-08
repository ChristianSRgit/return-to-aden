import { rev, S, count } from "../game/state";
import { itemIcon } from "../data";
import { shotId } from "../game/battle";
import { fmt } from "../game/format";

export function Wallet() {
  rev.value;
  const s = S();
  const sid = shotId();
  return (
    <div id="wallet" class="on">
      <span class="w">
        <img src={itemIcon(57)} alt="" />
        {fmt(s.adena)}
      </span>
      <span class="w sp">
        <img src={itemIcon(2509)} alt="" />
        {fmt(s.sp)} SP
      </span>
      <span class="w pot">
        <img src={itemIcon(1060)} alt="" />
        {count(1060) + count(1061)}
        <img src={itemIcon(sid)} alt="" style="margin-left:6px" />
        {count(sid)}
      </span>
    </div>
  );
}
