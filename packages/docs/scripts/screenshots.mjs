// Screenshots of the site in light / dark at desktop and mobile sizes.
// Usage: pnpm build && node scripts/screenshots.mjs [/path ...] [--full] [--base=http://localhost:3000] [--prefix=dev-]
//   without --base the exported site in out/ is served on a random port; with --base an already running server
//   (e.g. `next dev`) is used instead.
// Output: packages/docs/screenshots/<prefix><page>-<theme>-<viewport>.png (gitignored)
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { serve } from "./serve.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "screenshots");
mkdirSync(outDir, { recursive: true });

const args = process.argv.slice(2);
const full = args.includes("--full");
const option = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const base = option("base");
const prefix = option("prefix") ?? "";
const paths = args.filter((a) => a.startsWith("/"));
const pages = paths.length
    ? paths
    : [
          "/",
          "/docs",
          "/docs/chart-types/line",
          "/examples",
          "/examples/analytics-dashboard",
          "/api",
          "/api/series/line-series",
          "/gallery",
      ];
const viewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
];
const port = 4300 + Math.floor(Math.random() * 500);
const server = base ? undefined : await serve(port);
const origin = base ?? `http://localhost:${port}`;
const browser = await chromium.launch();
const errors = [];
try {
    for (const theme of ["light", "dark"]) {
        for (const vp of viewports) {
            const context = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, colorScheme: theme });
            await context.addInitScript((t) => localStorage.setItem("theme", t), theme);
            const page = await context.newPage();
            page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));
            page.on("console", (m) => m.type() === "error" && errors.push(`${page.url()}: ${m.text()}`));
            page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
            for (const path of pages) {
                await page.goto(`${origin}${path}`, { waitUntil: base ? "load" : "networkidle" });
                if (full) {
                    // grow the viewport to the page height (fullPage screenshots skip canvas frames)
                    const height = await page.evaluate(() => document.documentElement.scrollHeight);
                    await page.setViewportSize({ width: vp.width, height: Math.min(height, 12000) });
                    await page.waitForTimeout(400);
                    await page.evaluate(() => window.scrollTo(0, 0));
                }
                await page.waitForTimeout(base ? 5000 : 1500);
                const name =
                    prefix + (path === "/" ? "home" : path.slice(1).replaceAll("/", "_")) + `-${theme}-${vp.name}.png`;
                await page.screenshot({ path: join(outDir, name) });
                if (full) {
                    await page.setViewportSize(vp);
                }
                console.log(`screenshots/${name}`);
            }
            await context.close();
        }
    }
} finally {
    await browser.close();
    server?.close();
}
if (errors.length) {
    console.log(`\n${errors.length} browser errors:\n${[...new Set(errors)].join("\n")}`);
}
