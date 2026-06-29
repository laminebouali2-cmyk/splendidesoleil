import sharp from "sharp";
import fs from "fs";
import path from "path";
const src = "public/images";
const out = "public/opt";
fs.mkdirSync(out, { recursive: true });
const files = fs.readdirSync(src).filter((f) => /\.(jpe?g|png)$/i.test(f));
const dims = {};
let n = 0;
for (const f of files) {
  const base = f.replace(/\.(jpe?g|png)$/i, "");
  const dst = path.join(out, `${base}.webp`);
  const info = await sharp(path.join(src, f))
    .rotate()
    .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(dst);
  dims[`/opt/${base}.webp`] = { w: info.width, h: info.height };
  n++;
}
fs.writeFileSync("src/data/image-dims.json", JSON.stringify(dims, null, 0));
console.log("optimized", n, "→ public/opt/*.webp ; dims rewritten");
