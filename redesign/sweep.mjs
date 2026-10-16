// redesign/sweep.mjs — full-page screenshots of every state at 390 / 768 / 1440.
//
//   node redesign/sweep.mjs <label> [--base http://localhost:3100] [--only <substring>]
//
// Writes redesign/shots/<label>/<width>/<state>.png. Run against a production build
// (`npm run build && npx next start -p 3100`) so the dev overlay never appears.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FROZEN_NOW, respond } from "./fixtures.mjs";
import { STATES } from "./states.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const label = args[0];
if (!label || label.startsWith("--")) {
  console.error("usage: node redesign/sweep.mjs <label> [--base url] [--only substring]");
  process.exit(1);
}
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const BASE = opt("base", "http://localhost:3100");
const ONLY = opt("only", "");

export const WIDTHS = [390, 768, 1440];
const HEIGHT = { 390: 844, 768: 1024, 1440: 900 };

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const failures = [];
const unmocked = new Set();

for (const width of WIDTHS) {
  const outDir = path.join(here, "shots", label, String(width));
  await mkdir(outDir, { recursive: true });

  for (const state of STATES.filter((s) => s.id.includes(ONLY))) {
    const context = await browser.newContext({
      viewport: { width, height: HEIGHT[width] },
      deviceScaleFactor: 1,
      locale: "en-IE",
      timezoneId: "Europe/Dublin",
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    await page.clock.install({ time: FROZEN_NOW });

    await page.route("**/api/**", async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const [status, body] = respond(req.method(), url, state.api);
      if (status === 404 && body?.error?.startsWith("No fixture")) unmocked.add(`${req.method()} ${url.pathname}`);
      await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    });
    // Anything outside the app origin (fonts are self-hosted by next/font) is blocked.
    await page.route((u) => !u.href.startsWith(BASE), (r) => r.abort());

    const settle = async () => {
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.evaluate(() => document.fonts.ready);
    };
    const tick = async (ms) => { await page.clock.runFor(ms); };

    try {
      await page.goto(BASE + state.path, { waitUntil: "networkidle" });
      await settle();
      if (state.act) await state.act(page, { settle, tick });
      await settle();
      if (!state.viewport) {
        // Interactions scroll the page; return to the top so the sticky nav and
        // mobile action bar are in their resting state for a full-page capture.
        await page.evaluate(() => window.scrollTo(0, 0));
        await tick(100);
      }
      await page.mouse.move(0, 0);
      await page.screenshot({
        path: path.join(outDir, `${state.id}.png`),
        fullPage: !state.viewport,
        animations: "disabled",
        caret: "hide",
      });
      process.stdout.write(".");
    } catch (e) {
      failures.push(`${width} ${state.id}: ${e.message.split("\n")[0]}`);
      process.stdout.write("F");
    }
    await context.close();
  }
}

await browser.close();
console.log(`\n${label}: done.`);
if (unmocked.size) console.log("Unmocked API calls:\n  " + [...unmocked].join("\n  "));
if (failures.length) {
  console.log("Failures:\n  " + failures.join("\n  "));
  process.exit(1);
}
