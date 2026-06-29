import sharp from "sharp";
import fs from "fs";
import path from "path";

const dir = "public/images";
const outDir = "docs/research/contact";
fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(dir).filter((f) => /^IMG_.*\.jpe?g$/i.test(f)).sort();

const TW = 300, IH = 200, LH = 24, TH = IH + LH;
const COLS = 6, ROWS = 6, PER = COLS * ROWS;

async function makeTile(file) {
  const id = file.replace(/IMG_/i, "").replace(/\.jpe?g/i, "");
  const img = await sharp(path.join(dir, file)).rotate().resize(TW, IH, { fit: "contain", background: "#ffffff" }).toBuffer();
  const label = Buffer.from(
    `<svg width="${TW}" height="${LH}"><rect width="100%" height="100%" fill="#111"/><text x="6" y="17" font-family="monospace" font-size="15" fill="#fff">${id}</text></svg>`,
  );
  return sharp({ create: { width: TW, height: TH, channels: 3, background: "#ffffff" } })
    .composite([{ input: img, top: 0, left: 0 }, { input: label, top: IH, left: 0 }])
    .png()
    .toBuffer();
}

let sheet = 0;
for (let i = 0; i < files.length; i += PER) {
  sheet++;
  const chunk = files.slice(i, i + PER);
  const comps = [];
  for (let j = 0; j < chunk.length; j++) {
    const tile = await makeTile(chunk[j]);
    const r = Math.floor(j / COLS), c = j % COLS;
    comps.push({ input: tile, top: r * TH, left: c * TW });
  }
  await sharp({ create: { width: COLS * TW, height: ROWS * TH, channels: 3, background: "#ffffff" } })
    .composite(comps)
    .jpeg({ quality: 82 })
    .toFile(path.join(outDir, `sheet-${sheet}.jpg`));
  console.log(`sheet-${sheet}.jpg  (${chunk.length} imgs: ${chunk[0]} .. ${chunk[chunk.length - 1]})`);
}
console.log("done", files.length, "images,", sheet, "sheets");
