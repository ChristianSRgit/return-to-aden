// Renders a hand-drawn pixel-art canvas (monster / hero) into the DOM at its
// native size; CSS scales it up crisply.

import { useLayoutEffect, useRef } from "preact/hooks";
import { spriteFor, heroSprite, type GearView } from "../art/pixels";
import { MOBS, type ClassKey, type SpriteKey } from "../data";

function paint(host: HTMLElement, src: HTMLCanvasElement) {
  host.replaceChildren();
  const cv = document.createElement("canvas");
  cv.width = src.width;
  cv.height = src.height;
  const g = cv.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  g.drawImage(src, 0, 0);
  host.appendChild(cv);
}

export function MobSprite({ mid }: { mid: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const m = MOBS[mid];
  useLayoutEffect(() => {
    if (ref.current && m) paint(ref.current, spriteFor(m.art as SpriteKey, m.variant));
  }, [mid]);
  return <div ref={ref} class="sprite-host" />;
}

export function ArtSprite({ art, variant }: { art: SpriteKey; variant?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current) paint(ref.current, spriteFor(art, variant));
  }, [art, variant]);
  return <div ref={ref} class="sprite-host" />;
}

export function HeroSprite({ cls, gear }: { cls: ClassKey; gear: GearView }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current) paint(ref.current, heroSprite(cls, gear));
  }, [cls, gear.wpn, gear.arm, gear.shd, gear.acc]);
  return <div ref={ref} class="sprite-host" />;
}
