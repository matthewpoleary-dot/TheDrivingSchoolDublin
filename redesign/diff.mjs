// redesign/diff.mjs — pixel-diff two sweeps, route by route.
//
//   node redesign/diff.mjs <before-label> <after-label> [--threshold 0.1]
//
// Writes redesign/shots/diff-<before>-vs-<after>/<width>/<state>.png for every state
// that differs, and prints a table. Exit code 1 when anything differs, so Step 1
// ("change nothing visually") can be checked mechanically.
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const here = path.dirname(fileURLToPath(import.meta.url));
const [before, after] = process.argv.slice(2);
if (!before || !after) {
  console.error("usage: node redesign/diff.mjs <before-label> <after-label>");
  process.exit(1);
}
const tIdx = process.argv.indexOf("--threshold");
const threshold = tIdx === -1 ? 0.1 : Number(process.argv[tIdx + 1]);

const root = path.join(here, "shots");
const outRoot = path.join(root, `diff-${before}-vs-${after}`);
const rows = [];

const load = async (p) => PNG.sync.read(await readFile(p));

for (const width of await readdir(path.join(root, before))) {
  const files = (await readdir(path.join(root, before, width))).filter((f) => f.endsWith(".png"));
  for (const file of files) {
    const a = path.join(root, before, width, file);
    const b = path.join(root, after, width, file);
    const id = file.replace(/\.png$/, "");
    if (!existsSync(b)) { rows.push({ width, id, status: "MISSING" }); continue; }

    const [imgA, imgB] = await Promise.all([load(a), load(b)]);
    // Compare on a shared canvas so a height change still yields a usable diff.
    const w = Math.max(imgA.width, imgB.width);
    const h = Math.max(imgA.height, imgB.height);
    const pad = (img) => {
      if (img.width === w && img.height === h) return img.data;
      const out = new PNG({ width: w, height: h });
      out.data.fill(0);
      PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
      return out.data;
    };
    const diff = new PNG({ width: w, height: h });
    const changed = pixelmatch(pad(imgA), pad(imgB), diff.data, w, h, { threshold });
    const sizeChanged = imgA.width !== imgB.width || imgA.height !== imgB.height;
    if (changed === 0 && !sizeChanged) { rows.push({ width, id, status: "same" }); continue; }

    await mkdir(path.join(outRoot, width), { recursive: true });
    await writeFile(path.join(outRoot, width, file), PNG.sync.write(diff));
    rows.push({
      width, id, status: "CHANGED",
      pixels: changed,
      pct: ((changed / (w * h)) * 100).toFixed(3),
      size: sizeChanged ? `${imgA.width}x${imgA.height} → ${imgB.width}x${imgB.height}` : "",
    });
  }
}

const changed = rows.filter((r) => r.status !== "same");
for (const r of changed) {
  console.log(`${r.status.padEnd(8)} ${r.width.padStart(4)}  ${r.id.padEnd(36)} ${r.pixels ?? ""} px ${r.pct ? `(${r.pct}%)` : ""} ${r.size ?? ""}`);
}
console.log(`\n${rows.length - changed.length}/${rows.length} identical` + (changed.length ? `; diffs in ${path.relative(process.cwd(), outRoot)}` : ""));
process.exit(changed.length ? 1 : 0);
