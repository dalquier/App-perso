import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { deflateSync } from "node:zlib";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "public/icons/icon.svg");
const source = await readFile(sourcePath, "utf8");
const sizes = [180, 192, 512];

function sourceColor(name) {
  const match = source.match(new RegExp(`data-${name}="(#[0-9a-fA-F]{6})"`));
  if (!match) throw new Error(`Couleur data-${name} absente de icon.svg`);
  return match[1].slice(1).match(/../g).map((part) => Number.parseInt(part, 16));
}

const palette = {
  background: sourceColor("background"),
  border: sourceColor("border"),
  foreground: sourceColor("foreground"),
};

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function insideRoundedRect(x, y, left, top, width, height, radius) {
  const nearX = Math.max(left + radius - x, 0, x - (left + width - radius));
  const nearY = Math.max(top + radius - y, 0, y - (top + height - radius));
  return nearX * nearX + nearY * nearY <= radius * radius;
}

function isGlyph(x, y) {
  return x >= 154 && x < 358 && y >= 128 && y < 384
    && (x < 198 || (y < 174) || (y >= 232 && y < 278) || y >= 338);
}

function render(size) {
  const scanlines = [];
  for (let row = 0; row < size; row += 1) {
    const scanline = Buffer.alloc(1 + size * 4);
    for (let column = 0; column < size; column += 1) {
      const x = (column + 0.5) * 512 / size;
      const y = (row + 0.5) * 512 / size;
      let color = palette.border;
      if (insideRoundedRect(x, y, 42, 42, 428, 428, 34)) color = palette.background;
      if (isGlyph(x, y)) color = palette.foreground;
      const offset = 1 + column * 4;
      scanline.set([...color, 255], offset);
    }
    scanlines.push(scanline);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.concat(scanlines), { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

await mkdir(dirname(sourcePath), { recursive: true });
for (const size of sizes) {
  const destination = resolve(root, `public/icons/icon-${size}.png`);
  await writeFile(destination, render(size));
  console.log(`Icône générée : ${destination} (${size}x${size})`);
}
