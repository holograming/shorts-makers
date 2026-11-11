const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
(async () => {
const [html, outDir, ...ts] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(pathToFileURL(html).href + '?t=0');
await p.evaluate(() => document.fonts.ready);
for (const t of ts) { await p.evaluate(t => render(t), +t); await p.screenshot({ path: `${outDir}/t${t}.png` }); }
await b.close();
})();
