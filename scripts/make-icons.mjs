// Generates the PWA icons (public/icons/pwa-192.png, pwa-512.png) from the
// in-game crest shape. Pure Node — hand-rolls a PNG so there's no native dep.

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const SHAPE = [
  "  X      X  ",
  " XXX    XXX ",
  " XXXXXXXXXX ",
  "  XXXXXXXX  ",
  "   XXXXXX   ",
  "    XXXX    ",
  "     XX     ",
  "    XXXX    ",
  "   XXXXXX   ",
  "  XXXXXXXX  ",
];

function hex(c) {
  return [
    parseInt(c.slice(1, 3), 16),
    parseInt(c.slice(3, 5), 16),
    parseInt(c.slice(5, 7), 16),
  ];
}
const BG = hex("#0c0a0e");
const GOLD = hex("#f2b134");
const GOLD_SOFT = hex("#e9c877");

function render(size) {
  const px = new Uint8Array(size * size * 4);
  const set = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = 255;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) set(x, y, BG);

  const cols = SHAPE[0].length,
    rows = SHAPE.length;
  const cell = Math.floor((size * 0.62) / cols);
  const ox = Math.floor((size - cols * cell) / 2);
  const oy = Math.floor((size - rows * cell) / 2);
  SHAPE.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      if (ch !== "X") return;
      const col = ry < 2 || rx < 3 || rx > 7 ? GOLD : GOLD_SOFT;
      for (let dy = 0; dy < cell; dy++)
        for (let dx = 0; dx < cell; dx++)
          set(ox + rx * cell + dx, oy + ry * cell + dy, col);
    });
  });
  return px;
}

function png(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.subarray(y * size * 4, (y + 1) * size * 4).forEach((v, i) => {
      raw[y * (size * 4 + 1) + 1 + i] = v;
    });
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

let CRC_TABLE;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

for (const size of [192, 512]) {
  writeFileSync(join(OUT, `pwa-${size}.png`), png(size, render(size)));
  console.log(`pwa-${size}.png`);
}
