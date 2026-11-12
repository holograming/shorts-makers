const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  for (const s of [1, 2, 3]) {
    await p.goto(pathToFileURL(__dirname + '/sample.html').href + '?s=' + s);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${__dirname}/frame${s}.png` });
  }
  await b.close();
})();
