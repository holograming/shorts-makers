const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
(async () => {
const [html, outDir, fps = '30'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(pathToFileURL(html).href + '?t=0');
await p.evaluate(() => document.fonts.ready);
const dur = await p.evaluate(() => DURATION), n = Math.round(dur * +fps);
for (let i = 0; i < n; i++) {
  await p.evaluate(t => render(t), i / +fps);
  await p.screenshot({ path: `${outDir}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 95 });
}
await b.close(); console.log('frames', n);
})();
