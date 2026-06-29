import sharp from "sharp";
import fs from "fs";
import path from "path";
const dir = "public/images";
const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|webp|png)$/i.test(f));
const out = {};
for (const f of files) {
  try {
    const m = await sharp(path.join(dir, f)).rotate().metadata();
    out[`/images/${f}`] = { w: m.width, h: m.height };
  } catch (e) { console.log("skip", f, e.message); }
}
fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync("src/data/image-dims.json", JSON.stringify(out, null, 0));
console.log("wrote", Object.keys(out).length, "dims");
