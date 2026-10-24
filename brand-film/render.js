const { chromium } = require('playwright');
const [,, src, out, fps, dur] = process.argv;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto('file://' + src + '#render');
  await p.evaluate(() => window.ready);
  const n = Math.round(+fps * +dur);
  for (let i = 0; i < n; i++) {
    await p.evaluate(t => window.renderAt(t), i / +fps);
    await p.screenshot({ path: `${out}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 93 });
    if (i % 200 === 0) console.log('frame', i, '/', n);
  }
  await b.close();
})();
