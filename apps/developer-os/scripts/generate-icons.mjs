import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const iconSource = resolve("public/icons/icon-512.svg");

const targets = [
  ["public/icons/apple-touch-icon-180.png", 180],
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-512.png", 512],
];

const svg = await readFile(iconSource);

await Promise.all(
  targets.map(async ([target, size]) => {
    const output = resolve(target);
    await mkdir(dirname(output), { recursive: true });
    await sharp(svg, { density: 384 })
      .resize(size, size, { fit: "cover" })
      .png({ compressionLevel: 9 })
      .toFile(output);
  }),
);

console.log(
  `Generated ${targets.length} PNG icons from ${iconSource}: ${targets
    .map(([target]) => target)
    .join(", ")}`,
);
